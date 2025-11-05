"use client";

import { useState, useEffect } from "react";

interface Industry {
  id: number;
  name: string;
  sectors: Sector[];
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

interface CustomerEditModalProps {
  customer: Customer;
  industries: Industry[];
  onClose: () => void;
  onSave: (updatedCustomer: Customer) => void;
}

export default function CustomerEditModal({
  customer,
  industries,
  onClose,
  onSave,
}: CustomerEditModalProps) {
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email,
    company: customer.company || "",
    position: customer.position || "",
    industryId: customer.industry?.id || null as number | null,
    sectorId: customer.sector?.id || null as number | null,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);

  // 業界が変更されたら、業種リストを更新
  useEffect(() => {
    if (formData.industryId) {
      const selectedIndustry = industries.find((i) => i.id === formData.industryId);
      setAvailableSectors(selectedIndustry?.sectors || []);
      // 業界が変更されたら業種をリセット
      if (formData.sectorId) {
        const sectorBelongsToIndustry = selectedIndustry?.sectors.some(
          (s) => s.id === formData.sectorId
        );
        if (!sectorBelongsToIndustry) {
          setFormData((prev) => ({ ...prev, sectorId: null }));
        }
      }
    } else {
      setAvailableSectors([]);
      setFormData((prev) => ({ ...prev, sectorId: null }));
    }
  }, [formData.industryId, industries]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "更新に失敗しました");
      }

      onSave(data.customer);
      onClose();
    } catch (error) {
      console.error("顧客更新エラー:", error);
      setErrorMessage(error instanceof Error ? error.message : "更新に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">顧客情報を編集</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名前 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会社名
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役職
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  業界
                </label>
                <select
                  value={formData.industryId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      industryId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択なし</option>
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  業種
                </label>
                <select
                  value={formData.sectorId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sectorId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  disabled={!formData.industryId || availableSectors.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">選択なし</option>
                  {availableSectors.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                disabled={isSaving}
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                disabled={isSaving}
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
