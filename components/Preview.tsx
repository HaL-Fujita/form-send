"use client";

import { useState } from "react";

interface PreviewProps {
  htmlContent: string;
  isLoading: boolean;
}

export default function Preview({ htmlContent, isLoading }: PreviewProps) {
  const [viewMode, setViewMode] = useState<"pc" | "mobile">("pc");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("pc")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "pc"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            PC表示
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "mobile"
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Mobile表示
          </button>
        </div>
      </div>

      <div
        style={{ height: "683px" }}
        className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-auto transition-all ${
          viewMode === "pc" ? "w-full" : "mx-auto max-w-[375px]"
        }`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center max-w-md px-4">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-500 mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">HTMLメールを生成中...</p>
              <p className="text-sm text-gray-500 mb-4">AIが美しいHTMLメールを作成しています</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
              <p className="text-xs text-gray-400 mt-3">通常10〜15秒ほどかかります</p>
            </div>
          </div>
        ) : htmlContent ? (
          <div className="w-full p-4">
            <div
              style={{
                width: "100%"
              }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400 p-8">
            <div className="text-center max-w-md">
              <svg
                className="mx-auto h-16 w-16 mb-4 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-700 mb-4">メール本文を入力して<br/>「⚡ プレビュー生成」ボタンを押してください</p>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 HTMLメールの見た目を確認できます
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
