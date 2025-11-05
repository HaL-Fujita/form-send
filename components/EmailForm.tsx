"use client";

import { Customer } from "@/lib/types";

interface EmailFormProps {
  email: string;
  subject: string;
  body: string;
  instruction: string;
  onEmailChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onInstructionChange: (value: string) => void;
  onGenerateContent: () => void;
  isGenerating: boolean;
  onGeneratePersonalizedBulk?: () => void;
  isGeneratingPersonalized?: boolean;
  customersCount?: number;
  customers?: Customer[];
  selectedCustomerId?: string | null;
  onSelectCustomer?: (customerId: string | null) => void;
}

export default function EmailForm({
  email,
  subject,
  body,
  instruction,
  onEmailChange,
  onSubjectChange,
  onBodyChange,
  onInstructionChange,
  onGenerateContent,
  isGenerating,
  onGeneratePersonalizedBulk,
  isGeneratingPersonalized,
  customersCount = 0,
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
}: EmailFormProps) {
  const customersWithPersonalizedEmail = customers.filter(
    (c) => c.personalizedBody || c.personalizedSubject
  );

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* 顧客選択UI（個別メールが生成されている場合のみ表示） */}
      {customersWithPersonalizedEmail.length > 0 && onSelectCustomer && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            👥 個別メールを編集する顧客を選択
          </label>
          <select
            value={selectedCustomerId || ""}
            onChange={(e) => onSelectCustomer(e.target.value || null)}
            className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white"
          >
            <option value="">共通メール（全員に同じ内容）</option>
            {customersWithPersonalizedEmail.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.company}
                {customer.position && ` - ${customer.position}`})
              </option>
            ))}
          </select>
          <p className="text-xs text-purple-700 mt-2">
            {selectedCustomerId
              ? "💡 選択した顧客の個別営業メールを編集中。変更は自動保存されます。"
              : "💡 共通メールモード。全顧客に同じ営業メールを送信します。"}
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            件名
          </label>
          {subject && (
            <button
              onClick={() => handleCopyToClipboard(subject)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              コピー
            </button>
          )}
        </div>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="メールの件名を入力"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      {/* AI自動生成セクション */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
        <label htmlFor="instruction" className="block text-sm font-semibold text-gray-700 mb-2">
          🤖 AI自動生成：何を営業したいか入力してください
        </label>
        <div className="mb-2 text-xs text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
          💡 <strong>書き方のコツ：</strong>「商品・サービス名」「誰に」「何をアピールしたいか」を具体的に書くと、より良いメールが生成されます
        </div>
        <textarea
          id="instruction"
          value={instruction}
          onChange={(e) => onInstructionChange(e.target.value)}
          placeholder="新商品の掃除機ロボット「CleanPro X1」を法人向けに紹介したい。オフィス清掃の課題を解決できることをアピール。"
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none mb-3"
        />
        {customersCount > 0 && onGeneratePersonalizedBulk ? (
          <>
            <button
              onClick={onGeneratePersonalizedBulk}
              disabled={isGeneratingPersonalized || !instruction || !instruction.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGeneratingPersonalized ? (
                <>
                  <div className="relative">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  </div>
                  <span>AI生成中...</span>
                </>
              ) : (
                <>
                  <span>🎯</span>
                  <span>{customersCount}件の個別メールを一括生成</span>
                </>
              )}
            </button>
            {isGeneratingPersonalized && (
              <div className="mt-3 p-3 bg-purple-100 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="animate-pulse text-purple-600">⚡</div>
                  <p className="text-sm font-semibold text-purple-900">
                    {customersCount}件の営業メールを生成中...
                  </p>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-purple-700 mt-2">
                  各顧客に合わせたパーソナライズメールを作成しています
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 text-center py-3">
            👆 先に「顧客を選択」ボタンから送信先を追加してください
          </p>
        )}

        {customersCount > 0 && (
          <div className="text-xs text-purple-700 mt-3 p-2 bg-white rounded border border-purple-200">
            <p className="font-semibold mb-1">📝 個別メール生成の仕組み</p>
            <p>各顧客の「名前・会社名・役職」を自動で組み込んだパーソナライズメールを{customersCount}件分作成します</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="body" className="block text-sm font-medium text-gray-700">
            営業メール本文（自動生成 or 手動入力）
          </label>
          {body && (
            <button
              onClick={() => handleCopyToClipboard(body)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              コピー
            </button>
          )}
        </div>
        <textarea
          id="body"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder="営業メールの本文を手動で入力&#10;&#10;または、上の「AI自動生成」で営業内容を入力すれば自動で作成されます"
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          required
        />
      </div>
    </div>
  );
}
