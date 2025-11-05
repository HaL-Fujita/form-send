"use client";

import { useState, useEffect } from "react";

interface Industry {
  id: number;
  name: string;
  _count: { customers: number };
  sectors: Sector[];
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
  industry: { id: number; name: string } | null;
  sector: { id: number; name: string } | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
}

interface CustomerSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomers: (customers: Customer[]) => void;
  existingCustomers: Customer[];
}

export default function CustomerSelectionModal({
  isOpen,
  onClose,
  onAddCustomers,
  existingCustomers,
}: CustomerSelectionModalProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [allCustomers, setAllCustomers] = useState<DBCustomer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(new Set());
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchIndustries();
      fetchAllCustomers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchAllCustomers();
    }
  }, [selectedIndustryId, selectedSectorId, searchQuery, isOpen]);

  const fetchIndustries = async () => {
    try {
      const response = await fetch("/api/industries");
      const data = await response.json();
      setIndustries(data.industries);
    } catch (error) {
      console.error("業界データ取得エラー:", error);
    }
  };

  const fetchAllCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000",
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
      setAllCustomers(data.customers);
    } catch (error) {
      console.error("顧客データ取得エラー:", error);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleToggleAll = () => {
    if (selectedCustomerIds.size === allCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(allCustomers.map((c) => c.id)));
    }
  };

  const handleAddSelectedCustomers = () => {
    const selectedDBCustomers = allCustomers.filter((c) =>
      selectedCustomerIds.has(c.id)
    );
    const newCustomers: Customer[] = selectedDBCustomers.map((c) => ({
      id: `db-${c.id}`,
      name: c.name,
      email: c.email,
      company: c.company || "",
      position: c.position || "",
    }));

    const existingEmails = new Set(existingCustomers.map((c) => c.email.toLowerCase()));
    const uniqueNewCustomers = newCustomers.filter(
      (c) => !existingEmails.has(c.email.toLowerCase())
    );

    onAddCustomers(uniqueNewCustomers);
    setSelectedCustomerIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white p-4 md:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">顧客を選択</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1">メール送信先の顧客を選んでください</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 md:p-2 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* フィルター */}
        <div className="p-3 md:p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <input
              type="text"
              placeholder="🔍 名前・メール・会社名で検索"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedIndustryId || ""}
              onChange={(e) => {
                setSelectedIndustryId(e.target.value ? parseInt(e.target.value) : null);
                setSelectedSectorId(null);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">全ての業界</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name} ({industry._count.customers}件)
                </option>
              ))}
            </select>
            {selectedIndustryId && (
              <select
                value={selectedSectorId || ""}
                onChange={(e) => setSelectedSectorId(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="">全ての業種</option>
                {industries
                  .find((i) => i.id === selectedIndustryId)
                  ?.sectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* 顧客リスト */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingCustomers ? (
            <div className="text-center py-12 text-gray-500">読み込み中...</div>
          ) : allCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📭</div>
              <p>顧客が見つかりません</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleToggleAll}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm md:text-base"
                >
                  {selectedCustomerIds.size === allCustomers.length ? "✓ 全解除" : "☐ 全選択"}
                </button>
                <span className="text-sm md:text-base text-gray-600 font-medium">
                  {allCustomers.length}件中 <span className="text-blue-600 font-bold">{selectedCustomerIds.size}件</span> 選択
                </span>
              </div>

              <div className="space-y-2">
                {allCustomers.map((customer) => {
                  const isAlreadyAdded = existingCustomers.some(
                    (c) => c.email.toLowerCase() === customer.email.toLowerCase()
                  );

                  return (
                    <label
                      key={customer.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        isAlreadyAdded
                          ? "bg-green-50 border-green-200"
                          : selectedCustomerIds.has(customer.id)
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomerIds.has(customer.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedCustomerIds);
                          if (e.target.checked) {
                            newSet.add(customer.id);
                          } else {
                            newSet.delete(customer.id);
                          }
                          setSelectedCustomerIds(newSet);
                        }}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{customer.name}</span>
                          {isAlreadyAdded && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                              ✓ 追加済み
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{customer.email}</div>
                        {customer.company && (
                          <div className="text-xs text-gray-500">{customer.company}</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* フッター */}
        <div className="p-3 md:p-6 bg-gray-50 border-t border-gray-200 flex flex-col-reverse md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-0">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors text-sm md:text-base"
          >
            キャンセル
          </button>
          <button
            onClick={handleAddSelectedCustomers}
            disabled={selectedCustomerIds.size === 0}
            className="px-4 md:px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base"
          >
            選択した{selectedCustomerIds.size}件を追加
          </button>
        </div>
      </div>
    </div>
  );
}
