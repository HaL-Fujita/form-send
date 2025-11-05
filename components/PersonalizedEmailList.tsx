"use client";

import { useState } from "react";
import { Customer } from "@/lib/types";

interface PersonalizedEmailListProps {
  customers: Customer[];
  onUpdateCustomer: (customerId: string, subject: string, body: string) => void;
}

export default function PersonalizedEmailList({
  customers,
  onUpdateCustomer,
}: PersonalizedEmailListProps) {
  const [openCustomerId, setOpenCustomerId] = useState<string | null>(null);

  const customersWithEmail = customers.filter(
    (c) => c.personalizedBody || c.personalizedSubject
  );

  if (customersWithEmail.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          📧 個別生成されたメール内容 ({customersWithEmail.length}件)
        </h3>
      </div>

      <div className="space-y-2">
        {customersWithEmail.map((customer) => {
          const isOpen = openCustomerId === customer.id;

          return (
            <div
              key={customer.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all"
            >
              {/* ヘッダー */}
              <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setOpenCustomerId(isOpen ? null : customer.id)
                }
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform flex-shrink-0 ${
                      isOpen ? "rotate-90" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {customer.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {customer.company} {customer.position && `・ ${customer.position}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-50 rounded">
                  個別生成済み
                </span>
              </div>

              {/* 詳細（開閉） */}
              {isOpen && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                  {/* 件名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      件名
                    </label>
                    <input
                      type="text"
                      value={customer.personalizedSubject || ""}
                      onChange={(e) =>
                        onUpdateCustomer(
                          customer.id,
                          e.target.value,
                          customer.personalizedBody || ""
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                      placeholder="件名を入力"
                    />
                  </div>

                  {/* 本文 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      本文
                    </label>
                    <textarea
                      value={customer.personalizedBody || ""}
                      onChange={(e) =>
                        onUpdateCustomer(
                          customer.id,
                          customer.personalizedSubject || "",
                          e.target.value
                        )
                      }
                      rows={8}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-y"
                      placeholder="本文を入力"
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    💡 この内容は編集可能です。編集後、一括送信で反映されます。
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
