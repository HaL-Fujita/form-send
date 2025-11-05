// 顧客データの型定義
export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  position?: string;
  customFields?: Record<string, string>; // カスタムフィールド（拡張可能）
  personalizedSubject?: string; // 個別生成された件名
  personalizedBody?: string; // 個別生成されたメール本文
}

// 一括送信の結果
export interface BulkSendResult {
  total: number;
  success: number;
  failed: number;
  results: SendResult[];
}

export interface SendResult {
  customerId: string;
  customerEmail: string;
  customerName: string;
  success: boolean;
  error?: string;
  sentAt?: Date;
}

// 送信履歴
export interface SendHistory {
  id: string;
  subject: string;
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  sentAt: Date;
  customers: Customer[];
}
