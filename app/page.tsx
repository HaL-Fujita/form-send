"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import EmailForm from "@/components/EmailForm";
import BrandSettings from "@/components/BrandSettings";
import Preview from "@/components/Preview";
import CustomerList from "@/components/CustomerList";
import BulkSendProgress from "@/components/BulkSendProgress";
import CustomerSelectionModal from "@/components/CustomerSelectionModal";
import { Customer, BulkSendResult, SendHistory } from "@/lib/types";

interface Industry {
  id: number;
  name: string;
  sectors: Sector[];
  _count: { customers: number };
}

interface Sector {
  id: number;
  name: string;
  industryId: number;
}

interface DBCustomer {
  id: number;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  industry: Industry | null;
  sector: Sector | null;
}

export default function Home() {
  // フォーム状態
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [instruction, setInstruction] = useState("");

  // 顧客リスト状態（送信対象）
  const [customers, setCustomers] = useState<Customer[]>([]);

  // 顧客選択機能の状態
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [allCustomers, setAllCustomers] = useState<DBCustomer[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // ブランド設定状態
  const [primaryColor, setPrimaryColor] = useState("#2C3E50");
  const [accentColor, setAccentColor] = useState("#E74C3C");
  const [font, setFont] = useState("-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif");

  // プレビュー状態
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [message, setMessage] = useState("");

  // 一括送信状態
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [bulkSendResult, setBulkSendResult] = useState<BulkSendResult | null>(null);

  // 個別メール生成状態
  const [isGeneratingPersonalized, setIsGeneratingPersonalized] = useState(false);

  // 選択中の顧客ID（個別メール編集用）
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // テストメール送信状態
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  // メッセージ自動消去タイマー
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 成功メッセージの自動消去（エラーメッセージは残す）
  useEffect(() => {
    // 既存のタイマーをクリア
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    // 成功メッセージの場合のみ5秒後に自動消去
    if (message && !message.includes("❌") && !message.includes("エラー")) {
      messageTimeoutRef.current = setTimeout(() => {
        setMessage("");
      }, 5000); // 5秒後に消去
    }

    // クリーンアップ
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [message]);

  // 業界データを取得
  useEffect(() => {
    fetchIndustries();
  }, []);

  // 顧客データを取得（フィルタが変更された時）
  useEffect(() => {
    if (showCustomerSelector) {
      fetchAllCustomers();
    }
  }, [showCustomerSelector, selectedIndustryId, selectedSectorId, searchQuery]);

  // 顧客管理ページまたは送信履歴から選択された顧客を読み込む
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromSource = params.get('from');

    if (fromSource === 'customers' || fromSource === 'history') {
      const selectedCustomersData = localStorage.getItem('selectedCustomersForEmail');
      if (selectedCustomersData) {
        try {
          const selected = JSON.parse(selectedCustomersData);
          // Prismaのデータ構造をアプリのCustomer型に変換
          const formattedCustomers: Customer[] = selected.map((c: any, index: number) => ({
            id: `db-${c.id || c.id}`,
            name: c.name,
            email: c.email,
            company: c.company || '',
            position: c.position || '',
          }));
          setCustomers(formattedCustomers);
          const sourceText = fromSource === 'customers' ? '顧客管理' : '送信履歴';
          setMessage(`✅ ${sourceText}から${formattedCustomers.length}件の顧客を読み込みました`);
          // localStorageをクリア
          localStorage.removeItem('selectedCustomersForEmail');
          // URLパラメータをクリア
          window.history.replaceState({}, '', '/');
        } catch (error) {
          console.error('顧客データの読み込みエラー:', error);
        }
      }
    }
  }, []);

  // 業界データを取得
  const fetchIndustries = async () => {
    try {
      const response = await fetch("/api/industries");
      const data = await response.json();
      setIndustries(data.industries);
    } catch (error) {
      console.error("業界データ取得エラー:", error);
    }
  };

  // 顧客データを取得
  const fetchAllCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // 全件取得
      });

      if (selectedIndustryId) {
        params.append("industryId", selectedIndustryId.toString());
      }
      if (selectedSectorId) {
        params.append("sectorId", selectedSectorId.toString());
      }
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const response = await fetch(`/api/customers?${params}`);
      const data = await response.json();

      // メールアドレスで重複を除外（最新のものを保持）
      const uniqueCustomers = data.customers.reduce((acc: DBCustomer[], customer: DBCustomer) => {
        const existingIndex = acc.findIndex(c => c.email.toLowerCase() === customer.email.toLowerCase());
        if (existingIndex === -1) {
          // まだ存在しない場合は追加
          acc.push(customer);
        } else {
          // 既に存在する場合、IDが大きい方（新しい方）を保持
          if (customer.id > acc[existingIndex].id) {
            acc[existingIndex] = customer;
          }
        }
        return acc;
      }, []);

      const duplicateCount = data.customers.length - uniqueCustomers.length;
      if (duplicateCount > 0) {
        console.log(`⚠️ ${duplicateCount}件の重複顧客を除外しました`);
      }

      setAllCustomers(uniqueCustomers);
    } catch (error) {
      console.error("顧客データ取得エラー:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  // 選択した顧客を送信リストに追加
  const handleAddSelectedCustomers = () => {
    console.log('=== Add Customers Debug ===');
    console.log('Selected IDs:', Array.from(selectedCustomerIds));
    console.log('All customers:', allCustomers.length);

    const selectedDBCustomers = allCustomers.filter(c => selectedCustomerIds.has(c.id));
    console.log('Filtered customers:', selectedDBCustomers.length);

    const newCustomers: Customer[] = selectedDBCustomers.map(c => ({
      id: `db-${c.id}`,
      name: c.name,
      email: c.email,
      company: c.company || '',
      position: c.position || '',
    }));

    console.log('New customers:', newCustomers);

    // メールアドレスで重複を除外（より確実）
    const existingEmails = new Set(customers.map(c => c.email.toLowerCase()));
    const uniqueNewCustomers = newCustomers.filter(c => !existingEmails.has(c.email.toLowerCase()));
    const duplicateCount = newCustomers.length - uniqueNewCustomers.length;

    console.log('Unique new customers:', uniqueNewCustomers.length);
    console.log('Duplicates found:', duplicateCount);
    console.log('Current customers before:', customers.length);

    const updatedCustomers = [...customers, ...uniqueNewCustomers];
    console.log('Updated customers after:', updatedCustomers.length);

    setCustomers(updatedCustomers);

    if (duplicateCount > 0) {
      setMessage(`✅ ${uniqueNewCustomers.length}件を追加しました（${duplicateCount}件は既に存在するためスキップ）`);
    } else {
      setMessage(`✅ ${uniqueNewCustomers.length}件の顧客を追加しました`);
    }

    setSelectedCustomerIds(new Set());
    setShowCustomerSelector(false);
  };

  // 全選択/全解除
  const handleToggleAll = () => {
    if (selectedCustomerIds.size === allCustomers.length) {
      // 全解除
      setSelectedCustomerIds(new Set());
    } else {
      // 全選択
      setSelectedCustomerIds(new Set(allCustomers.map(c => c.id)));
    }
  };

  // 顧客削除
  const handleRemoveCustomer = (customerId: string) => {
    setCustomers(customers.filter((c) => c.id !== customerId));
  };

  // 顧客リスト全削除
  const handleClearCustomers = () => {
    if (confirm("顧客リストを全て削除しますか？")) {
      setCustomers([]);
      setMessage("顧客リストをクリアしました");
    }
  };

  // メール本文を自動生成（Claude API連携）
  const handleGenerateContent = async () => {
    if (!instruction.trim()) {
      setMessage("メール生成の指示を入力してください");
      return;
    }

    setIsGeneratingContent(true);
    setMessage("");

    try {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instruction,
          subject: subject || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "APIエラー");
      }

      setBody(data.content);

      // AIが提案した色を自動設定
      if (data.primaryColor) {
        setPrimaryColor(data.primaryColor);
      }
      if (data.accentColor) {
        setAccentColor(data.accentColor);
      }

      setMessage("🎉 メール本文と色を自動生成しました！");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      let detailedMessage = `❌ メール生成エラー: ${errorMessage}`;

      // エラーの種類に応じて対処法を追加
      if (errorMessage.includes("API") || errorMessage.includes("401") || errorMessage.includes("403")) {
        detailedMessage += "\n\n💡 対処法: .env.local の ANTHROPIC_API_KEY を確認してください";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("タイムアウト")) {
        detailedMessage += "\n\n💡 対処法: しばらく待ってから再度お試しください";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("レート制限")) {
        detailedMessage += "\n\n💡 対処法: API利用制限に達しました。時間をおいて再試行してください";
      }

      setMessage(detailedMessage);
      console.error(error);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  // 顧客ごとに個別のメールを一括生成
  const handleGeneratePersonalizedBulk = async () => {
    if (customers.length === 0) {
      setMessage("顧客リストをアップロードしてください");
      return;
    }

    if (!instruction.trim()) {
      setMessage("メール生成の指示を入力してください");
      return;
    }

    setIsGeneratingPersonalized(true);
    setMessage("");

    try {
      const response = await fetch("/api/generate-personalized-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customers,
          instruction,
          subject: subject || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "APIエラー");
      }

      // 各顧客に個別メールを設定
      const updatedCustomers = customers.map((customer) => {
        const result = data.results.find(
          (r: any) => r.customerId === customer.id
        );
        if (result && result.success) {
          return {
            ...customer,
            personalizedSubject: result.subject,
            personalizedBody: result.body,
          };
        }
        return customer;
      });

      setCustomers(updatedCustomers);

      // 最初の顧客を自動選択して本文欄に表示 + HTMLプレビュー生成
      const firstCustomerWithEmail = updatedCustomers.find(
        (c) => c.personalizedBody || c.personalizedSubject
      );
      if (firstCustomerWithEmail) {
        setSelectedCustomerId(firstCustomerWithEmail.id);
        setSubject(firstCustomerWithEmail.personalizedSubject || "");
        setBody(firstCustomerWithEmail.personalizedBody || "");

        // HTMLプレビューも自動生成
        if (firstCustomerWithEmail.personalizedBody) {
          setIsLoading(true);
          try {
            const previewResponse = await fetch("/api/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: firstCustomerWithEmail.personalizedBody,
                primaryColor,
                accentColor,
                font,
              }),
            });

            const previewData = await previewResponse.json();

            if (previewResponse.ok) {
              setHtmlContent(previewData.html);
            }
          } catch (error) {
            console.error("HTMLプレビュー生成エラー:", error);
          } finally {
            setIsLoading(false);
          }
        }
      }

      setMessage(
        `🎉 ${data.results.filter((r: any) => r.success).length}件の個別メールを生成しました！`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      let detailedMessage = `❌ 個別メール生成エラー: ${errorMessage}`;

      // エラーの種類に応じて対処法を追加
      if (errorMessage.includes("API") || errorMessage.includes("401") || errorMessage.includes("403")) {
        detailedMessage += "\n\n💡 対処法: .env.local の ANTHROPIC_API_KEY を確認してください";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("タイムアウト")) {
        detailedMessage += "\n\n💡 対処法: 顧客数が多い場合は時間がかかります。少人数で試すか、しばらく待ってください";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("レート制限")) {
        detailedMessage += "\n\n💡 対処法: API利用制限に達しました。時間をおいて再試行するか、顧客を分割してください";
      }

      setMessage(detailedMessage);
      console.error(error);
    } finally {
      setIsGeneratingPersonalized(false);
    }
  };

  // 顧客選択時の処理（個別メールを本文欄に反映 + HTMLプレビュー自動生成）
  const handleSelectCustomer = async (customerId: string | null) => {
    setSelectedCustomerId(customerId);

    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      if (customer) {
        setSubject(customer.personalizedSubject || "");
        setBody(customer.personalizedBody || "");

        // 個別メールのHTMLプレビューを自動生成
        if (customer.personalizedBody) {
          setIsLoading(true);
          try {
            const response = await fetch("/api/generate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: customer.personalizedBody,
                primaryColor,
                accentColor,
                font,
              }),
            });

            const data = await response.json();

            if (response.ok) {
              setHtmlContent(data.html);
            }
          } catch (error) {
            console.error("HTMLプレビュー生成エラー:", error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    } else {
      // 共通メールモードに戻す
      setHtmlContent("");
    }
  };

  // 件名・本文が変更された時、選択中の顧客がいれば自動保存
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);

    if (selectedCustomerId) {
      setCustomers(
        customers.map((customer) =>
          customer.id === selectedCustomerId
            ? { ...customer, personalizedSubject: newSubject }
            : customer
        )
      );
    }
  };

  const handleBodyChange = (newBody: string) => {
    setBody(newBody);

    if (selectedCustomerId) {
      setCustomers(
        customers.map((customer) =>
          customer.id === selectedCustomerId
            ? { ...customer, personalizedBody: newBody }
            : customer
        )
      );

      // 個別メール編集時は、HTMLプレビューをクリア（再生成を促す）
      setHtmlContent("");
    }
  };

  // プレビュー生成（Claude API連携）
  const handleGeneratePreview = async () => {
    if (!body.trim()) {
      setMessage("本文を入力してください");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: body,
          primaryColor,
          accentColor,
          font,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "APIエラー");
      }

      setHtmlContent(data.html);
      setMessage("✅ HTMLメールを生成しました！");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      let detailedMessage = `❌ HTMLプレビュー生成エラー: ${errorMessage}`;

      // エラーの種類に応じて対処法を追加
      if (errorMessage.includes("API") || errorMessage.includes("401") || errorMessage.includes("403")) {
        detailedMessage += "\n\n💡 対処法: .env.local の ANTHROPIC_API_KEY を確認してください";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("タイムアウト")) {
        detailedMessage += "\n\n💡 対処法: しばらく待ってから再度お試しください";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("レート制限")) {
        detailedMessage += "\n\n💡 対処法: API利用制限に達しました。時間をおいて再試行してください";
      }

      setMessage(detailedMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // テストメール送信
  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      setMessage("送信先メールアドレスを入力してください");
      return;
    }

    if (!htmlContent) {
      setMessage("先にHTMLプレビューを生成してください");
      return;
    }

    // 簡易的なメールアドレス検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      setMessage("正しいメールアドレスを入力してください");
      return;
    }

    setIsSendingTest(true);
    setMessage("");

    try {
      const response = await fetch("/api/send-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: testEmail,
          subject: subject || "テストメール",
          html: htmlContent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "送信エラー");
      }

      setMessage(`✅ テストメールを ${testEmail} に送信しました！`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      let detailedMessage = `❌ テストメール送信エラー: ${errorMessage}`;

      // エラーの種類に応じて対処法を追加
      if (errorMessage.includes("Invalid login") || errorMessage.includes("535") || errorMessage.includes("認証")) {
        detailedMessage += "\n\n💡 対処法: .env.local のメール設定を確認してください\n";
        detailedMessage += "1. Googleアプリパスワードを生成: https://myaccount.google.com/apppasswords\n";
        detailedMessage += "2. SMTP_USER と FROM_EMAIL にGmailアドレスを設定\n";
        detailedMessage += "3. SMTP_PASS に生成した16桁のパスワードを設定\n";
        detailedMessage += "4. サーバーを再起動";
      } else if (errorMessage.includes("ECONNECTION") || errorMessage.includes("ETIMEDOUT") || errorMessage.includes("接続")) {
        detailedMessage += "\n\n💡 対処法: ネットワーク接続を確認してください。ファイアウォールでポート587がブロックされていないか確認してください";
      } else if (errorMessage.includes("recipient") || errorMessage.includes("宛先")) {
        detailedMessage += "\n\n💡 対処法: 送信先メールアドレスが正しいか確認してください";
      }

      setMessage(detailedMessage);
      console.error(error);
    } finally {
      setIsSendingTest(false);
    }
  };

  // 自動プレビュー更新（デバウンス付き）
  const autoPreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [autoPreviewEnabled, setAutoPreviewEnabled] = useState(true);

  useEffect(() => {
    // 自動プレビューが有効で、本文があり、既にHTMLプレビューが生成されている場合のみ自動更新
    if (autoPreviewEnabled && body.trim() && htmlContent && !isLoading && !selectedCustomerId) {
      // デバウンス処理：1秒待ってから実行
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }

      autoPreviewTimeoutRef.current = setTimeout(async () => {
        try {
          setIsLoading(true);
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: body,
              primaryColor,
              accentColor,
              font,
            }),
          });

          const data = await response.json();

          if (response.ok) {
            setHtmlContent(data.html);
            console.log('✨ プレビューを自動更新しました');
          }
        } catch (error) {
          console.error("自動プレビュー更新エラー:", error);
        } finally {
          setIsLoading(false);
        }
      }, 1000); // 1秒のデバウンス
    }

    // クリーンアップ
    return () => {
      if (autoPreviewTimeoutRef.current) {
        clearTimeout(autoPreviewTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, primaryColor, accentColor, font, autoPreviewEnabled]);

  // 一括送信
  const handleBulkSend = async () => {
    if (customers.length === 0) {
      setMessage("顧客リストをアップロードしてください");
      return;
    }

    if (!subject || !body) {
      setMessage("件名と本文を入力してください");
      return;
    }

    if (
      !confirm(
        `${customers.length}件の顧客にメールを一括送信しますか？\n\n※ 差し込み機能: {name}, {company}, {position} が使えます`
      )
    ) {
      return;
    }

    setIsBulkSending(true);
    setBulkSendResult(null);
    setMessage("");

    try {
      const response = await fetch("/api/bulk-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customers,
          subject,
          bodyTemplate: body,
          primaryColor,
          accentColor,
          font,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || "一括送信エラー");
      }

      setBulkSendResult(data.result);
      setMessage(
        `✅ 一括送信完了: 成功${data.result.success}件 / 失敗${data.result.failed}件 (履歴はDBに保存されました)`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "不明なエラー";
      let detailedMessage = `❌ 一括送信エラー: ${errorMessage}`;

      // エラーの種類に応じて対処法を追加
      if (errorMessage.includes("Invalid login") || errorMessage.includes("535") || errorMessage.includes("認証")) {
        detailedMessage += "\n\n💡 対処法: .env.local のメール設定を確認してください\n";
        detailedMessage += "1. Googleアプリパスワードを生成: https://myaccount.google.com/apppasswords\n";
        detailedMessage += "2. SMTP_USER と FROM_EMAIL にGmailアドレスを設定\n";
        detailedMessage += "3. SMTP_PASS に生成した16桁のパスワードを設定\n";
        detailedMessage += "4. サーバーを再起動";
      } else if (errorMessage.includes("API") || errorMessage.includes("401") || errorMessage.includes("403")) {
        detailedMessage += "\n\n💡 対処法: .env.local の ANTHROPIC_API_KEY を確認してください";
      } else if (errorMessage.includes("timeout") || errorMessage.includes("タイムアウト")) {
        detailedMessage += "\n\n💡 対処法: 顧客数が多い場合は時間がかかります。少人数で試すか、しばらく待ってください";
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("レート制限")) {
        detailedMessage += "\n\n💡 対処法: API利用制限に達しました。時間をおいて再試行するか、顧客を分割してください";
      }

      setMessage(detailedMessage);
      console.error(error);
    } finally {
      setIsBulkSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 md:px-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 md:mb-6">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              営業メール一括送信ツール
            </h1>
            <p className="text-xs md:text-sm text-gray-600">
              Claude Sonnet × HTMLメール × 一括送信
            </p>
          </div>
        </header>

        {/* ナビゲーションタブ */}
        <nav className="mb-6 md:mb-8 flex justify-center overflow-x-auto">
          <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
            <div className="px-4 md:px-6 py-2 md:py-2.5 font-semibold text-sm md:text-base text-gray-800 bg-white rounded-md shadow-sm whitespace-nowrap">
              📧 メール送信
            </div>
            <Link
              href="/customers"
              className="px-4 md:px-6 py-2 md:py-2.5 font-semibold text-sm md:text-base text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all whitespace-nowrap"
            >
              👥 顧客管理
            </Link>
            <Link
              href="/history"
              className="px-4 md:px-6 py-2 md:py-2.5 font-semibold text-sm md:text-base text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all whitespace-nowrap"
            >
              📊 送信履歴
            </Link>
          </div>
        </nav>

        {/* メッセージ表示（全幅） */}
        {message && (
          <div
            className={`p-4 rounded-lg font-medium mb-6 transition-all duration-300 ${
              message.includes("エラー") || message.includes("❌")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            <div className="flex items-start gap-3 whitespace-pre-line text-left max-w-4xl mx-auto">
              <div className="flex-1">
                {message}
              </div>
              {!message.includes("❌") && !message.includes("エラー") && (
                <button
                  onClick={() => setMessage("")}
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  title="閉じる"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 顧客選択セクション（ヘッダー） */}
        <div className="mb-6">
          <button
            onClick={() => setShowCustomerSelector(true)}
            className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg hover:from-blue-500 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 md:gap-3"
          >
            <span className="text-xl md:text-2xl">👥</span>
            <span>顧客を選択</span>
            {customers.length > 0 && (
              <span className="bg-white text-blue-700 px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-bold">
                {customers.length}件選択中
              </span>
            )}
          </button>
        </div>

        {/* 顧客リスト表示 */}
        {customers.length > 0 && (
          <div className="mb-6">
            <CustomerList
              customers={customers}
              onRemove={handleRemoveCustomer}
              onClear={handleClearCustomers}
            />
          </div>
        )}

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* 左カラム */}
          <div className="flex flex-col gap-4 md:gap-6">

            {/* STEP 1: メール作成 */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl font-bold text-gray-700">
                  1
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-800">メール作成</h2>
                  <p className="text-xs text-gray-600">AI自動生成または手動入力</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-5 flex-1">
                <EmailForm
                  email=""
                  subject={subject}
                  body={body}
                  instruction={instruction}
                  onEmailChange={() => {}}
                  onSubjectChange={handleSubjectChange}
                  onBodyChange={handleBodyChange}
                  onInstructionChange={setInstruction}
                  onGenerateContent={handleGenerateContent}
                  isGenerating={isGeneratingContent}
                  onGeneratePersonalizedBulk={handleGeneratePersonalizedBulk}
                  isGeneratingPersonalized={isGeneratingPersonalized}
                  customersCount={customers.length}
                  customers={customers}
                  selectedCustomerId={selectedCustomerId}
                  onSelectCustomer={handleSelectCustomer}
                />
              </div>
            </div>

            {/* デザイン設定（オプション） */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl text-gray-400">
                  ⚙️
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-800">デザイン設定</h2>
                  <p className="text-xs text-gray-600">色とフォントをカスタマイズ（オプション）</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-5 flex-1">
                <BrandSettings
                  primaryColor={primaryColor}
                  accentColor={accentColor}
                  font={font}
                  onPrimaryColorChange={setPrimaryColor}
                  onAccentColorChange={setAccentColor}
                  onFontChange={setFont}
                />
              </div>
            </div>
          </div>

          {/* 右カラム */}
          <div className="flex flex-col gap-4 md:gap-6">

            {/* STEP 2: プレビュー */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl font-bold text-gray-700">
                  2
                </span>
                <div className="flex-1">
                  <h2 className="text-base md:text-lg font-bold text-gray-800">HTMLプレビュー</h2>
                  <p className="text-xs text-gray-600">メール表示を確認</p>
                </div>
                {/* 自動更新トグル */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPreviewEnabled}
                    onChange={(e) => setAutoPreviewEnabled(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded focus:ring-2 focus:ring-pink-500"
                  />
                  <span className="text-xs text-gray-600">自動更新</span>
                </label>
                {/* プレビュー生成ボタン */}
                <button
                  onClick={handleGeneratePreview}
                  disabled={isLoading || !body.trim()}
                  className="bg-white border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium text-sm hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {isLoading ? "生成中..." : "⚡ プレビュー生成"}
                </button>
                {htmlContent && (
                  <button
                    onClick={handleGeneratePreview}
                    disabled={isLoading}
                    className="px-3 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="プレビューを再生成"
                  >
                    🔄
                  </button>
                )}
              </div>

              {autoPreviewEnabled && htmlContent && (
                <div className="mb-3 text-xs text-gray-500 bg-green-50 py-2 px-3 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✨</span>
                    <span className="font-medium text-green-800">自動更新ON</span>
                  </div>
                  <p className="mt-1 text-green-700">
                    本文やデザイン変更後、<strong>1秒後</strong>に自動でプレビューが更新されます
                  </p>
                </div>
              )}

              <Preview htmlContent={htmlContent} isLoading={isLoading} />
            </div>

            {/* STEP 3: メール送信 */}
            <div className="flex-1 flex flex-col">
              <div className="mb-2 md:mb-3 flex items-center gap-2 md:gap-3">
                <span className="text-xl md:text-2xl font-bold text-gray-700">
                  3
                </span>
                <div>
                  <h2 className="text-base md:text-lg font-bold text-gray-800">メール送信</h2>
                  <p className="text-xs text-gray-600">
                    {customers.length > 0
                      ? `${customers.length}件に一括送信`
                      : "顧客を選択してください"}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 md:p-5 flex-1 flex flex-col">

              {/* 上部スペーサー */}
              <div className="flex-1"></div>

              {/* テストメール送信 */}
              {htmlContent && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">テスト送信（オプション）</h3>
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleSendTestEmail}
                      disabled={isSendingTest || !testEmail.trim()}
                      className="w-full bg-white border-2 border-blue-300 text-blue-700 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-50 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isSendingTest ? (
                        <>
                          <div className="relative">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          </div>
                          <span>送信中...</span>
                        </>
                      ) : (
                        <>
                          <span>✉️</span>
                          <span>テスト送信</span>
                        </>
                      )}
                    </button>
                    {isSendingTest && (
                      <p className="text-xs text-blue-700 text-center mt-2 animate-pulse">
                        メールを送信しています...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 一括送信ボタン */}
              <button
                onClick={handleBulkSend}
                disabled={isBulkSending || isLoading || customers.length === 0}
                className={`w-full py-4 px-5 rounded-lg font-bold transition-all duration-300 flex items-center justify-center gap-3 ${
                  customers.length > 0 && !isBulkSending
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isBulkSending ? (
                  <>
                    <div className="relative">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs">📧</span>
                      </div>
                    </div>
                    <span>送信中...</span>
                  </>
                ) : customers.length > 0 ? (
                  <>
                    <span className="text-xl">📨</span>
                    <span>{customers.length}件に一括送信</span>
                  </>
                ) : (
                  <>
                    <span>📨</span>
                    <span>顧客を選択してください</span>
                  </>
                )}
              </button>

              {/* 送信中の進捗表示 */}
              {isBulkSending && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-bounce text-orange-600">📨</div>
                    <p className="text-sm font-semibold text-orange-900">
                      {customers.length}件にメールを送信中...
                    </p>
                  </div>
                  <div className="w-full bg-orange-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs text-orange-700 mt-2">
                    HTMLメールの生成と送信を行っています
                  </p>
                </div>
              )}

              {customers.length > 0 && !isBulkSending && (
                <p className="mt-3 text-center text-xs text-gray-600">
                  ⚠️ 送信前にプレビューで内容を確認してください
                </p>
              )}

              {/* 一括送信結果 */}
              {(isBulkSending || bulkSendResult) && (
                <div className="mt-4">
                  <BulkSendProgress
                    isProcessing={isBulkSending}
                    result={bulkSendResult}
                  />
                </div>
              )}

              {/* 下部スペーサー */}
              <div className="flex-1"></div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-8 md:mt-10 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            {/* 差し込み変数クイックリファレンス */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
              <h3 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span>📝</span>
                <span>差し込み変数</span>
              </h3>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-0.5 rounded text-indigo-600 font-mono">{"{name}"}</code>
                  <span className="text-indigo-700">顧客名</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-0.5 rounded text-indigo-600 font-mono">{"{company}"}</code>
                  <span className="text-indigo-700">会社名</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-2 py-0.5 rounded text-indigo-600 font-mono">{"{position}"}</code>
                  <span className="text-indigo-700">役職</span>
                </div>
              </div>
            </div>

            {/* 送信のヒント */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <h3 className="text-sm font-bold text-green-900 mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>送信のヒント</span>
              </h3>
              <ul className="space-y-1 text-xs text-green-800">
                <li className="flex items-start gap-1">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>送信前に必ずプレビューで確認</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>テスト送信で表示を確認推奨</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>個別メール生成で名前の反映を確認</span>
                </li>
              </ul>
            </div>

            {/* クイックアクション */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <h3 className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                <span>⚡</span>
                <span>クイックアクション</span>
              </h3>
              <div className="space-y-2">
                <Link
                  href="/history"
                  className="block text-xs bg-white hover:bg-orange-50 text-orange-900 font-medium px-3 py-2 rounded transition-colors border border-orange-200"
                >
                  📊 送信履歴を確認
                </Link>
                <div className="text-xs text-orange-800 pt-1">
                  <p className="font-medium">最大50件まで保存</p>
                  <p className="text-orange-700">成功率や詳細を確認可能</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500">
            Powered by Claude Sonnet + Nodemailer
          </p>
        </footer>
      </div>

      {/* 顧客選択モーダル */}
      <CustomerSelectionModal
        isOpen={showCustomerSelector}
        onClose={() => setShowCustomerSelector(false)}
        onAddCustomers={(newCustomers) => {
          // メールアドレスで重複を除外
          const existingEmails = new Set(customers.map(c => c.email.toLowerCase()));
          const uniqueNewCustomers = newCustomers.filter(
            c => !existingEmails.has(c.email.toLowerCase())
          );
          const duplicateCount = newCustomers.length - uniqueNewCustomers.length;

          setCustomers([...customers, ...uniqueNewCustomers]);

          if (duplicateCount > 0) {
            setMessage(`✅ ${uniqueNewCustomers.length}件を追加しました（${duplicateCount}件は既に存在するためスキップ）`);
          } else {
            setMessage(`✅ ${uniqueNewCustomers.length}件の顧客を追加しました`);
          }
        }}
        existingCustomers={customers}
      />
    </main>
  );
}
