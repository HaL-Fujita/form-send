"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SendHistory } from "@/lib/types";

export default function HistoryPage() {
  const [history, setHistory] = useState<SendHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<SendHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [sortBy, setSortBy] = useState<"date" | "recipients" | "success">("date");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/history?page=1&limit=100");
      const data = await response.json();

      if (response.ok) {
        // Date型に変換
        const historyWithDates = data.histories.map((item: any) => ({
          ...item,
          sentAt: new Date(item.sentAt),
        }));
        setHistory(historyWithDates);
        console.log(`✅ ${historyWithDates.length}件の送信履歴を取得しました`);
      } else {
        console.error("履歴取得エラー:", data.error);
      }
    } catch (error) {
      console.error("履歴の読み込みエラー:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("この送信履歴を削除しますか？")) {
      try {
        const response = await fetch(`/api/history/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const newHistory = history.filter((item) => item.id !== id);
          setHistory(newHistory);
          if (selectedHistory?.id === id) {
            setSelectedHistory(null);
          }
        }
      } catch (error) {
        console.error("削除エラー:", error);
        alert("削除に失敗しました");
      }
    }
  };

  const handleClearAll = async () => {
    if (confirm("全ての送信履歴を削除しますか？この操作は取り消せません。")) {
      try {
        const response = await fetch("/api/history", {
          method: 'DELETE',
        });

        if (response.ok) {
          setHistory([]);
          setSelectedHistory(null);
        }
      } catch (error) {
        console.error("一括削除エラー:", error);
        alert("削除に失敗しました");
      }
    }
  };

  const handleResendToCustomers = (customers: any[]) => {
    // 顧客リストをlocalStorageに保存してメール送信ページに遷移
    localStorage.setItem("selectedCustomersForEmail", JSON.stringify(customers));
    window.location.href = "/?from=history";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return formatDate(date);
  };

  // フィルタリングとソート機能
  const filteredAndSortedHistory = useMemo(() => {
    let filtered = [...history];

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customers.some((c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.company?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // ステータスフィルター
    if (filterStatus === "success") {
      filtered = filtered.filter((item) => item.failedCount === 0);
    } else if (filterStatus === "failed") {
      filtered = filtered.filter((item) => item.failedCount > 0);
    }

    // ソート
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return b.sentAt.getTime() - a.sentAt.getTime();
      } else if (sortBy === "recipients") {
        return b.totalRecipients - a.totalRecipients;
      } else if (sortBy === "success") {
        const aRate = a.totalRecipients > 0 ? a.successCount / a.totalRecipients : 0;
        const bRate = b.totalRecipients > 0 ? b.successCount / b.totalRecipients : 0;
        return bRate - aRate;
      }
      return 0;
    });

    return filtered;
  }, [history, searchQuery, filterStatus, sortBy]);

  // CSVエクスポート機能
  const handleExportCSV = () => {
    const csvHeader = "送信日時,件名,総送信数,成功数,失敗数,成功率\n";
    const csvRows = history.map((item) => {
      const successRate = item.totalRecipients > 0
        ? Math.round((item.successCount / item.totalRecipients) * 100)
        : 0;
      return `"${formatDate(item.sentAt)}","${item.subject}",${item.totalRecipients},${item.successCount},${item.failedCount},${successRate}%`;
    }).join("\n");

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `送信履歴_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <header className="mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              📊 送信履歴
            </h1>
            <p className="text-sm text-gray-600">
              過去の一括送信の記録を確認できます（データベースに永続保存）
            </p>
          </div>
        </header>

        {/* 読み込み中 */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">履歴を読み込み中...</p>
          </div>
        )}

        {/* ナビゲーションタブ */}
        <nav className="mb-8 flex justify-center">
          <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
            <Link
              href="/"
              className="px-6 py-2.5 font-semibold text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all"
            >
              📧 メール送信
            </Link>
            <Link
              href="/customers"
              className="px-6 py-2.5 font-semibold text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-md transition-all"
            >
              👥 顧客管理
            </Link>
            <div className="px-6 py-2.5 font-semibold text-gray-800 bg-white rounded-md shadow-sm">
              📊 送信履歴
            </div>
          </div>
        </nav>

        {history.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">
              送信履歴がありません
            </h2>
            <p className="text-gray-600 mb-6">
              メールを送信すると、ここに履歴が表示されます
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              メールを送信する
            </Link>
          </div>
        ) : (
          <>
            {/* 統計サマリー */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md border border-blue-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-blue-900">総送信回数</div>
                  <span className="text-2xl">📧</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {history.length}
                  <span className="text-base font-normal text-blue-700 ml-2">回</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md border border-green-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-green-900">総送信件数</div>
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {history.reduce((sum, item) => sum + item.totalRecipients, 0)}
                  <span className="text-base font-normal text-green-700 ml-2">件</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md border border-purple-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-purple-900">成功率</div>
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {history.length > 0
                    ? Math.round(
                        (history.reduce((sum, item) => sum + item.successCount, 0) /
                          history.reduce((sum, item) => sum + item.totalRecipients, 0)) *
                          100
                      )
                    : 0}
                  <span className="text-base font-normal text-purple-700 ml-2">%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md border border-orange-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-orange-900">失敗件数</div>
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="text-3xl font-bold text-orange-600">
                  {history.reduce((sum, item) => sum + item.failedCount, 0)}
                  <span className="text-base font-normal text-orange-700 ml-2">件</span>
                </div>
              </div>
            </div>

            {/* 検索・フィルター・アクションバー */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* 検索バー */}
                <div className="md:col-span-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="件名、宛先で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  </div>
                </div>

                {/* フィルター */}
                <div className="md:col-span-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="all">全てのステータス</option>
                    <option value="success">✅ 成功のみ</option>
                    <option value="failed">⚠️ 失敗あり</option>
                  </select>
                </div>

                {/* ソート */}
                <div className="md:col-span-3">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="date">📅 日付順</option>
                    <option value="recipients">👥 送信数順</option>
                    <option value="success">✅ 成功率順</option>
                  </select>
                </div>

                {/* アクションボタン */}
                <div className="md:col-span-2 flex gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                    title="CSV形式でエクスポート"
                  >
                    📥
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                    title="全て削除"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* フィルター結果表示 */}
              {(searchQuery || filterStatus !== "all") && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    {filteredAndSortedHistory.length}件の履歴を表示中
                    {searchQuery && (
                      <span className="ml-2">
                        (検索: <span className="font-semibold">{searchQuery}</span>)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* 2カラムレイアウト */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左カラム：履歴リスト */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between">
                  <span>送信履歴一覧</span>
                  <span className="text-sm font-normal text-gray-600">
                    {filteredAndSortedHistory.length}件
                  </span>
                </h2>
                {filteredAndSortedHistory.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
                    <div className="text-4xl mb-3">🔍</div>
                    <p className="text-gray-600">該当する履歴がありません</p>
                  </div>
                ) : (
                  filteredAndSortedHistory.map((item) => {
                    const successRate = item.totalRecipients > 0
                      ? Math.round((item.successCount / item.totalRecipients) * 100)
                      : 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-lg shadow-md border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                          selectedHistory?.id === item.id
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedHistory(item)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-bold text-gray-800 flex-1 mr-2 line-clamp-1">
                            {item.subject}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors text-sm flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                          <span>📅 {formatRelativeDate(item.sentAt)}</span>
                          {item.failedCount === 0 ? (
                            <span className="text-green-600 font-semibold">✅ 全て成功</span>
                          ) : (
                            <span className="text-orange-600 font-semibold">⚠️ 失敗あり</span>
                          )}
                        </div>

                        {/* 成功率プログレスバー */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">成功率</span>
                            <span className="font-semibold text-gray-800">{successRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                successRate === 100
                                  ? "bg-gradient-to-r from-green-500 to-green-600"
                                  : successRate >= 80
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : successRate >= 50
                                  ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                  : "bg-gradient-to-r from-red-500 to-red-600"
                              }`}
                              style={{ width: `${successRate}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex gap-2 text-xs">
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">
                            👥 {item.totalRecipients}件
                          </span>
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">
                            ✅ {item.successCount}件
                          </span>
                          {item.failedCount > 0 && (
                            <span className="bg-red-50 text-red-700 px-2 py-1 rounded font-medium">
                              ❌ {item.failedCount}件
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 右カラム：詳細表示 */}
              <div className="lg:sticky lg:top-8 lg:self-start">
                {selectedHistory ? (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    {/* ヘッダー */}
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                      <h2 className="text-lg font-bold mb-2">
                        送信詳細
                      </h2>
                      <p className="text-sm text-blue-100">
                        {formatDate(selectedHistory.sentAt)}
                      </p>
                    </div>

                    <div className="p-6">
                      {/* 件名 */}
                      <div className="mb-6">
                        <div className="text-sm text-gray-600 mb-1 font-semibold">件名</div>
                        <div className="text-gray-800 bg-gray-50 rounded-lg p-3 border border-gray-200">
                          {selectedHistory.subject}
                        </div>
                      </div>

                      {/* 統計カード */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200">
                          <div className="text-2xl font-bold text-blue-600">
                            {selectedHistory.totalRecipients}
                          </div>
                          <div className="text-xs text-blue-800 font-medium mt-1">総送信数</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200">
                          <div className="text-2xl font-bold text-green-600">
                            {selectedHistory.successCount}
                          </div>
                          <div className="text-xs text-green-800 font-medium mt-1">成功</div>
                        </div>
                        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-3 text-center border border-red-200">
                          <div className="text-2xl font-bold text-red-600">
                            {selectedHistory.failedCount}
                          </div>
                          <div className="text-xs text-red-800 font-medium mt-1">失敗</div>
                        </div>
                      </div>

                      {/* 成功率プログレスバー */}
                      <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">成功率</span>
                          <span className="text-lg font-bold text-gray-900">
                            {selectedHistory.totalRecipients > 0
                              ? Math.round((selectedHistory.successCount / selectedHistory.totalRecipients) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all rounded-full"
                            style={{
                              width: `${selectedHistory.totalRecipients > 0
                                ? (selectedHistory.successCount / selectedHistory.totalRecipients) * 100
                                : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* 送信先一覧 */}
                      <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center justify-between">
                          <span>送信先一覧</span>
                          <span className="text-sm font-normal text-gray-600">
                            {selectedHistory.customers.length}件
                          </span>
                        </h3>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                          {selectedHistory.customers.map((customer, index) => (
                            <div
                              key={customer.id}
                              className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-800 truncate">
                                    {customer.name}
                                  </div>
                                  <div className="text-sm text-blue-600 truncate">
                                    {customer.email}
                                  </div>
                                  {customer.company && (
                                    <div className="text-sm text-gray-600 truncate">
                                      {customer.company}
                                      {customer.position && ` · ${customer.position}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 再送信ボタン */}
                      <div className="mt-6">
                        <button
                          onClick={() => handleResendToCustomers(selectedHistory.customers)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>📧</span>
                          <span>この宛先に再度メール送信</span>
                        </button>
                        <p className="text-xs text-gray-600 text-center mt-2">
                          同じ宛先に新しいメールを送信できます
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-12 text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">詳細を表示</h3>
                    <p className="text-gray-600">
                      左側の履歴をクリックすると<br />詳細情報が表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
