import { Customer } from './types';

/**
 * テンプレート文字列に顧客情報を差し込む
 * {name}, {email}, {company}, {position} などのプレースホルダーを置換
 */
export function applyTemplate(template: string, customer: Customer): string {
  let result = template;

  // 基本フィールドの差し込み
  result = result.replace(/{name}/g, customer.name || '');
  result = result.replace(/{email}/g, customer.email || '');
  result = result.replace(/{company}/g, customer.company || '');
  result = result.replace(/{position}/g, customer.position || '');

  // カスタムフィールドの差し込み
  if (customer.customFields) {
    Object.entries(customer.customFields).forEach(([key, value]) => {
      const placeholder = new RegExp(`{${key}}`, 'g');
      result = result.replace(placeholder, value || '');
    });
  }

  return result;
}

/**
 * テンプレート内で使用されているプレースホルダーを検出
 */
export function detectPlaceholders(template: string): string[] {
  const matches = template.match(/{([^}]+)}/g);
  if (!matches) return [];

  return matches.map((match) => match.replace(/[{}]/g, ''));
}

/**
 * テンプレートのプレビュー用サンプルデータ
 */
export const sampleCustomer: Customer = {
  id: 'sample-1',
  name: '田中太郎',
  email: 'tanaka@example.com',
  company: '株式会社サンプル',
  position: '営業部長',
};
