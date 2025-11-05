"use client";

import { useState } from "react";
import { Customer } from "@/lib/types";

interface CustomerListProps {
  customers: Customer[];
  onRemove: (customerId: string) => void;
  onClear: () => void;
}

export default function CustomerList({
  customers,
  onRemove,
  onClear,
}: CustomerListProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (customers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-fadeIn">
      {/* ヘッダー（常に表示） */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${
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
          <h3 className="text-base font-semibold text-gray-800">
            顧客リスト ({customers.length}件)
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded-lg transition-colors"
        >
          全て削除
        </button>
      </div>

      {/* 開閉可能なコンテンツ */}
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">名前</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">メールアドレス</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">会社名</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-700">役職</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">操作</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-2 px-3">{customer.name}</td>
                    <td className="py-2 px-3 text-blue-600">{customer.email}</td>
                    <td className="py-2 px-3">{customer.company}</td>
                    <td className="py-2 px-3 text-gray-600">{customer.position || "-"}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onRemove(customer.id)}
                        className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors text-xs"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              この{customers.length}件の顧客に一括でメールを送信できます
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
