"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CustomerEditModal from "@/components/CustomerEditModal";

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

interface Customer {
  id: number;
  name: string;
  email: string;
  company: string | null;
  position: string | null;
  industry: Industry | null;
  sector: Sector | null;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ImportHistory {
  id: number;
  fileName: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  industriesCount: number;
  sectorsCount: number;
  importedAt: string;
}

export default function CustomersPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [lastImportedFile, setLastImportedFile] = useState<string | null>(null);
  const [importHistories, setImportHistories] = useState<ImportHistory[]>([]);
  const [showHistories, setShowHistories] = useState(false);

  // 業界データを取得
  useEffect(() => {
    fetchIndustries();
  }, []);

  // 顧客データを取得
  useEffect(() => {
    fetchCustomers();
  }, [selectedIndustryId, selectedSectorId, currentPage, searchQuery]);

  // インポート履歴を取得
  useEffect(() => {
    fetchImportHistories();
  }, []);

  const fetchIndustries = async () => {
    try {
      const response = await fetch("/api/industries");
      const data = await response.json();
      setIndustries(data.industries);
    } catch (error) {
      console.error("業界データ取得エラー:", error);
    }
  };

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
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

      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (error) {
      console.error("顧客データ取得エラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImportHistories = async () => {
    try {
      const response = await fetch("/api/import-history?limit=20");
      const data = await response.json();
      if (data.success) {
        setImportHistories(data.histories);
        // 最新のインポートファイル名を設定
        if (data.histories.length > 0) {
          setLastImportedFile(data.histories[0].fileName);
        }
      }
    } catch (error) {
      console.error("インポート履歴取得エラー:", error);
    }
  };

  const handleDeleteHistory = async (historyId: number) => {
    if (!confirm("この履歴を削除しますか？")) {
      return;
    }

    try {
      const response = await fetch(`/api/import-history?id=${historyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage("✅ インポート履歴を削除しました");
        fetchImportHistories();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ 履歴削除に失敗しました");
      }
    } catch (error) {
      console.error("履歴削除エラー:", error);
      setMessage("❌ 履歴削除エラー");
    }
  };

  const handleDeleteAllCustomers = async () => {
    if (!confirm("⚠️ 警告: 全ての顧客データを削除しますか？\n\nこの操作は取り消せません。")) {
      return;
    }

    if (!confirm("本当によろしいですか？全データが完全に削除されます。")) {
      return;
    }

    setIsLoading(true);
    setMessage("🗑️ 全顧客データを削除中...");

    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.deletedCount}件の顧客データを削除しました`);
        fetchCustomers();
        fetchIndustries();
      } else {
        setMessage(`❌ 削除エラー: ${data.error}`);
      }
    } catch (error) {
      console.error("全削除エラー:", error);
      setMessage("❌ 全削除エラー");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== CSV Import Started ===');
    const file = e.target.files?.[0];
    console.log('Selected file:', file?.name, 'Size:', file?.size);

    if (!file) {
      console.log('No file selected');
      return;
    }

    const fileName = file.name;
    setLastImportedFile(fileName);
    setIsImporting(true);
    setMessage(`📤 "${fileName}" をインポート中...`);
    console.log('Import state set to true');

    const formData = new FormData();
    formData.append("file", file);

    try {
      console.log('Sending request to /api/customers/import');
      const response = await fetch("/api/customers/import", {
        method: "POST",
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setMessage(`✅ "${fileName}" から${data.successCount}件のデータをインポートしました（業界: ${data.industries}、業種: ${data.sectors}）`);
        fetchIndustries();
        fetchCustomers();
        fetchImportHistories(); // インポート履歴を更新
      } else {
        setMessage(`❌ "${fileName}" のインポートに失敗: ${data.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setMessage(`❌ "${fileName}" のインポートエラー: ${error}`);
    } finally {
      console.log('Import finished');
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const toggleCustomerSelection = (customerId: number) => {
    const newSelection = new Set(selectedCustomers);
    if (newSelection.has(customerId)) {
      newSelection.delete(customerId);
    } else {
      newSelection.add(customerId);
    }
    setSelectedCustomers(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedCustomers.size === customers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(customers.map(c => c.id)));
    }
  };

  const handleSendToSelected = () => {
    const selected = customers.filter(c => selectedCustomers.has(c.id));

    // 選択した顧客データをlocalStorageに保存してメール送信ページに遷移
    localStorage.setItem("selectedCustomersForEmail", JSON.stringify(selected));
    window.location.href = "/?from=customers";
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
  };

  const handleSaveCustomer = (updatedCustomer: Customer) => {
    // 顧客リストを更新
    setCustomers(customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setMessage(`✅ ${updatedCustomer.name} の情報を更新しました`);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleDeleteCustomer = async (customerId: number, customerName: string) => {
    if (!confirm(`${customerName} を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCustomers(customers.filter(c => c.id !== customerId));
        setMessage(`✅ ${customerName} を削除しました`);
        setTimeout(() => setMessage(""), 3000);
        // ページネーション情報も更新
        if (pagination) {
          setPagination({
            ...pagination,
            total: pagination.total - 1,
          });
        }
      } else {
        const data = await response.json();
        setMessage(`❌ 削除失敗: ${data.error}`);
      }
    } catch (error) {
      console.error("削除エラー:", error);
      setMessage(`❌ 削除エラー: ${error}`);
    }
  };

  const selectedIndustry = industries.find(i => i.id === selectedIndustryId);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              顧客データベース管理
            </h1>
            <p className="text-sm text-gray-600">
              150万件対応 · 業界・業種別フィルタリング
            </p>
          </div>
        </header>

        {/* ナビゲーションタブ */}
        <nav className="mb-8 flex justify-center">
          <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
            <Link
              href="/"
              className="px-6 py-2.5 font-semibold text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all"
            >
              📧 メール送信
            </Link>
            <div className="px-6 py-2.5 font-semibold text-gray-800 bg-white rounded-md shadow-sm">
              👥 顧客管理
            </div>
            <Link
              href="/history"
              className="px-6 py-2.5 font-semibold text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all"
            >
              📊 送信履歴
            </Link>
          </div>
        </nav>

        {/* メッセージ表示 */}
        {message && (
          <div
            className={`p-4 rounded-lg text-center font-medium mb-6 ${
              message.includes("エラー") || message.includes("❌")
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-green-50 text-green-800 border border-green-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* CSVインポート */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              CSVインポート（大量データ対応）
            </h2>
            {lastImportedFile && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-gray-500">最後にインポート:</span>
                <span className="font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                  📄 {lastImportedFile}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                disabled={isImporting}
                className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </label>
            {isImporting && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm font-semibold">インポート中...</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            CSVフォーマット: name, email, company, position, industry, sector
          </p>
          {lastImportedFile && (
            <p className="mt-2 text-xs text-gray-500">
              💡 同じファイルを再インポートすると、既存データは上書き更新されます（メールアドレスがキー）
            </p>
          )}

          {/* 全削除ボタン */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleDeleteAllCustomers}
              disabled={isLoading}
              className="w-full bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <span>🗑️</span>
              <span>全顧客データを削除</span>
            </button>
            <p className="text-xs text-red-600 mt-2 text-center">
              ⚠️ この操作は取り消せません。おかしい名前のデータを一括削除する場合に使用してください。
            </p>
          </div>
        </div>

        {/* インポート履歴 */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              インポート履歴（全{importHistories.length}件）
            </h2>
            <button
              onClick={() => setShowHistories(!showHistories)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              {showHistories ? "▲ 閉じる" : "▼ 表示する"}
            </button>
          </div>

          {showHistories && (
            <>
              {importHistories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  インポート履歴がありません
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">ファイル名</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">インポート日時</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">総行数</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">成功</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">エラー</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">業界</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">業種</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importHistories.map((history) => (
                        <tr key={history.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-blue-700">
                            📄 {history.fileName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(history.importedAt).toLocaleString('ja-JP', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {history.totalRows.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-green-700 font-medium">
                              {history.successCount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={history.errorCount > 0 ? "text-red-700 font-medium" : "text-gray-400"}>
                              {history.errorCount.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {history.industriesCount}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {history.sectorsCount}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteHistory(history.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左サイドバー: 業界・業種フィルター */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <h3 className="font-bold text-gray-800 mb-3">業界フィルター</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedIndustryId(null);
                    setSelectedSectorId(null);
                    setCurrentPage(1);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !selectedIndustryId
                      ? "bg-blue-100 text-blue-800 font-semibold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  全て
                </button>
                {industries.map(industry => (
                  <button
                    key={industry.id}
                    onClick={() => {
                      setSelectedIndustryId(industry.id);
                      setSelectedSectorId(null);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedIndustryId === industry.id
                        ? "bg-blue-100 text-blue-800 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {industry.name}
                    <span className="ml-2 text-xs text-gray-500">
                      ({industry._count.customers})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 業種フィルター */}
            {selectedIndustry && selectedIndustry.sectors.length > 0 && (
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">業種フィルター</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => {
                      setSelectedSectorId(null);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedSectorId
                        ? "bg-green-100 text-green-800 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    全ての業種
                  </button>
                  {selectedIndustry.sectors.map(sector => (
                    <button
                      key={sector.id}
                      onClick={() => {
                        setSelectedSectorId(sector.id);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSectorId === sector.id
                          ? "bg-green-100 text-green-800 font-semibold"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {sector.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* メインエリア: 顧客リスト */}
          <div className="lg:col-span-3">
            {/* 検索バーと選択アクション */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="名前、メールアドレス、会社名で検索..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {pagination && (
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}〜
                    {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
                  </div>
                  {selectedCustomers.size > 0 && (
                    <button
                      onClick={handleSendToSelected}
                      className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                    >
                      📨 選択した{selectedCustomers.size}件にメール送信
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 顧客テーブル */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">読み込み中...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📭</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">
                    顧客データがありません
                  </h3>
                  <p className="text-gray-600">
                    CSVファイルをインポートして顧客データを追加してください
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.size === customers.length && customers.length > 0}
                            onChange={toggleAllSelection}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">名前</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">メールアドレス</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">会社名</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">役職</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">業界</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">業種</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">アクション</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customers.map((customer) => (
                        <tr
                          key={customer.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            selectedCustomers.has(customer.id) ? "bg-blue-50" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.has(customer.id)}
                              onChange={() => toggleCustomerSelection(customer.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{customer.name}</td>
                          <td className="px-4 py-3 text-sm text-blue-600">{customer.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{customer.company || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{customer.position || "-"}</td>
                          <td className="px-4 py-3 text-sm">
                            {customer.industry ? (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                {customer.industry.name}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {customer.sector ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                {customer.sector.name}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditCustomer(customer)}
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs font-medium"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs font-medium"
                              >
                                削除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ページネーション */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  前へ
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pagination.totalPages > 5 && (
                    <>
                      <span className="text-gray-500">...</span>
                      <button
                        onClick={() => setCurrentPage(pagination.totalPages)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          currentPage === pagination.totalPages
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  次へ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 編集モーダル */}
        {editingCustomer && (
          <CustomerEditModal
            customer={editingCustomer}
            industries={industries}
            onClose={() => setEditingCustomer(null)}
            onSave={handleSaveCustomer}
          />
        )}
      </div>
    </main>
  );
}
