"use client";

import { BulkSendResult } from "@/lib/types";

interface BulkSendProgressProps {
  isProcessing: boolean;
  result: BulkSendResult | null;
}

export default function BulkSendProgress({
  isProcessing,
  result,
}: BulkSendProgressProps) {
  if (!isProcessing && !result) {
    return null;
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      {isProcessing && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            一括送信中...
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700">メールを順次送信しています...</p>
            </div>
            <p className="text-sm text-gray-500">
              この処理には数分かかる場合があります
            </p>
          </div>
        </div>
      )}

      {result && !isProcessing && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            送信結果
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{result.total}</p>
              <p className="text-sm text-gray-600">合計</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{result.success}</p>
              <p className="text-sm text-gray-600">成功</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-sm text-gray-600">失敗</p>
            </div>
          </div>

          {/* 成功率 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">成功率</span>
              <span className="text-sm font-semibold text-gray-800">
                {result.total > 0
                  ? Math.round((result.success / result.total) * 100)
                  : 0}
                %
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{
                  width: `${result.total > 0 ? (result.success / result.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* エラー詳細 */}
          {result.failed > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                送信失敗 ({result.failed}件)
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {result.results
                  .filter((r) => !r.success)
                  .map((r, index) => (
                    <div
                      key={index}
                      className="text-sm bg-white p-2 rounded border border-red-100"
                    >
                      <p className="font-medium text-gray-800">{r.customerName}</p>
                      <p className="text-gray-600">{r.customerEmail}</p>
                      <p className="text-red-600 text-xs mt-1">{r.error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {result.success > 0 && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-lg text-center">
              {result.success}件のメールを送信しました！
            </div>
          )}
        </div>
      )}
    </div>
  );
}
