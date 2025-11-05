"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Customer } from "@/lib/types";

interface CSVUploadProps {
  onUpload: (customers: Customer[]) => void;
}

export default function CSVUpload({ onUpload }: CSVUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルのみアップロード可能です');
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // CSVデータを顧客オブジェクトに変換
          let skippedCount = 0;
          const customers: Customer[] = results.data.map((row: any, index) => {
            // 列名のマッピング（様々なフォーマットに対応）
            const name = row['代表者名'] || row['担当者名'] || row['氏名'] || row['名前'] || row['name'] || "";
            let email = row['メールアドレス'] || row['Email'] || row['mail'] || row['email'] || "";
            const company = row['法人名称'] || row['会社名'] || row['社名'] || row['法人名'] || row['company'] || "";
            const position = row['役職'] || row['肩書き'] || row['部署'] || row['position'] || "";

            // 複数のメールアドレスがスラッシュで区切られている場合、最初のものを使用
            if (email && email.includes('/')) {
              const emails = email.split('/').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
              email = emails[0] || "";
            }

            // メールアドレスの簡易検証
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !emailRegex.test(email)) {
              console.warn(`行${index + 2}: 無効なメールアドレス形式 "${email}" のためスキップしました`);
              skippedCount++;
              return null;
            }

            // メールアドレスが無い場合はスキップ（警告のみ）
            if (!email) {
              console.warn(`行${index + 2}: メールアドレスがないためスキップしました - ${company}`);
              skippedCount++;
              return null;
            }

            // 会社名が無い場合もスキップ
            if (!company) {
              console.warn(`行${index + 2}: 法人名称がないためスキップしました`);
              skippedCount++;
              return null;
            }

            return {
              id: `customer-${Date.now()}-${index}`,
              name: name || company, // 代表者名がない場合は会社名を使用
              email: email,
              company: company,
              position: position,
              customFields: {}, // 追加フィールドがあれば拡張可能
            };
          }).filter((c): c is Customer => c !== null); // nullを除外

          if (customers.length === 0) {
            throw new Error("有効なデータが見つかりませんでした。「メールアドレス」と「法人名称」の列が必要です。");
          }

          onUpload(customers);

          // スキップされた件数を表示
          if (skippedCount > 0) {
            setSuccessMessage(`✅ ${customers.length}件を読み込みました（${skippedCount}件はメールアドレスがないためスキップ）`);
          } else {
            setSuccessMessage(`✅ ${customers.length}件を読み込みました`);
          }
          setError("");
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "CSVの解析に失敗しました";
          setError(errorMessage);
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setError(`CSVの読み込みエラー: ${err.message}`);
        setIsUploading(false);
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <div className="mb-3 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-sm font-semibold text-blue-900 mb-2">
          📋 対応している列名
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-800">
          <div>
            <strong>✅ 必須:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>法人名称 / 会社名 / 社名</li>
              <li>メールアドレス / Email / mail</li>
            </ul>
          </div>
          <div>
            <strong>📝 任意:</strong>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>代表者名 / 担当者名 / 氏名</li>
              <li>役職 / 肩書き / 部署</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          💡 Excelファイルは一度CSVで保存してからアップロードしてください
        </p>
      </div>

      {/* ドラッグ&ドロップエリア */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="space-y-3">
          <div className="text-4xl">📄</div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {isDragging ? 'ここにドロップしてください' : 'CSVファイルをドラッグ&ドロップ'}
            </p>
            <p className="text-xs text-gray-500">または</p>
          </div>
          <label className="inline-block">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            <span className="inline-block px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 cursor-pointer transition-colors">
              ファイルを選択
            </span>
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>CSVファイルを読み込み中...</span>
        </div>
      )}

      {error && (
        <div className="mt-3 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-3 p-3 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
          {successMessage}
        </div>
      )}
    </div>
  );
}
