import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

const BATCH_SIZE = 1000; // 1000件ずつバッチ処理

// ファイル名から業界を抽出する関数
function extractIndustryFromFileName(fileName: string): string {
  // "通信業.xlsx - シート1.csv" → "通信業"
  // "情報サービス業.xlsx - シート1.csv" → "情報サービス業"
  const match = fileName.match(/^(.+?)\.xlsx/);
  if (match && match[1]) {
    return match[1].trim();
  }
  // .xlsxがない場合は.csvの前まで
  const csvMatch = fileName.match(/^(.+?)\.csv/);
  if (csvMatch && csvMatch[1]) {
    return csvMatch[1].trim();
  }
  return "未分類";
}

// 業種(中分類1)を10種類に集約するマッピング関数
function mapSectorToCategory(rawSector: string): string {
  const sector = rawSector.trim();

  // 1. 通信サービス業
  if (sector === '通信業') {
    return '通信サービス業';
  }

  // 2. 通信設備工事業
  if (sector === '設備工事業' || sector === '総合工事業') {
    return '通信設備工事業';
  }

  // 3. IT・情報サービス業
  if (sector === '情報サービス業') {
    return 'IT・情報サービス業';
  }

  // 4. インターネット関連サービス
  if (sector === 'インターネット附随サービス業') {
    return 'インターネット関連サービス';
  }

  // 5. 放送・メディア業
  if (sector === '放送業' || sector === '映像・音声・文字情報制作業') {
    return '放送・メディア業';
  }

  // 6. 通信機器製造業
  if (sector === '情報通信機械器具製造業' ||
      sector === '電子部品・デバイス・電子回路製造業' ||
      sector === '電気機械器具製造業' ||
      sector === '業務用機械器具製造業' ||
      sector === '非鉄金属製造業') {
    return '通信機器製造業';
  }

  // 7. 専門・技術サービス業
  if (sector === '専門サービス業（他に分類されないもの）' ||
      sector === '技術サービス業（他に分類されないもの）' ||
      sector === '学術・開発研究機関') {
    return '専門・技術サービス業';
  }

  // 8. 広告・マーケティング業
  if (sector === '広告業') {
    return '広告・マーケティング業';
  }

  // 9. 人材・派遣サービス業
  if (sector === '職業紹介・労働者派遣業') {
    return '人材・派遣サービス業';
  }

  // 10. その他（上記以外すべて）
  return 'その他';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 400 }
      );
    }

    const text = await file.text();

    // ファイル名から業界を抽出
    const industryFromFile = extractIndustryFromFileName(file.name);

    console.log('=== CSV Import Debug ===');
    console.log('File name:', file.name);
    console.log('Extracted industry:', industryFromFile);
    console.log('File size:', text.length);

    // papaparseでCSVを正しく解析
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''), // BOM削除
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV Parse Errors:', parseResult.errors);
    }

    const dataRows = parseResult.data as Record<string, string>[];

    console.log('Total rows parsed:', dataRows.length);
    console.log('Headers:', parseResult.meta.fields);
    console.log('First row sample:', dataRows[0]);

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: 'CSVファイルが空です' },
        { status: 400 }
      );
    }

    // 業界と業種のキャッシュ（重複を避けるため）
    const industryCache = new Map<string, number>();
    const sectorCache = new Map<string, number>();

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    // バッチ処理でデータをインポート
    for (let i = 0; i < dataRows.length; i += BATCH_SIZE) {
      const batch = dataRows.slice(i, i + BATCH_SIZE);

      const customersToInsert = await Promise.all(
        batch.map(async (row, index) => {
          try {
            // papaparseが既にオブジェクトに変換済み

            // 列名のマッピング（様々なフォーマットに対応）
            const name = row['代表者名'] || row['担当者名'] || row['氏名'] || row['名前'] || row['name'] || "";
            let email = row['メールアドレス'] || row['Email'] || row['mail'] || row['email'] || "";
            const company = row['法人名称'] || row['会社名'] || row['社名'] || row['法人名'] || row['company'] || "";
            const position = row['役職'] || row['肩書き'] || row['部署'] || row['position'] || "";
            // 業界はファイル名から自動抽出（例：通信業.xlsx → "通信業"）
            const industry = industryFromFile;
            // 業種(中分類1)を10種類に集約（現在は通信業用のマッピング）
            const rawSector = row['業種(中分類1)'] || row['業種中分類'] || "";
            const sector = rawSector ? mapSectorToCategory(rawSector) : "その他";

            // 複数のメールアドレスがスラッシュで区切られている場合、最初のものを使用
            if (email && email.includes('/')) {
              const emails = email.split('/').map((e: string) => e.trim()).filter((e: string) => e.length > 0);
              email = emails[0] || "";
            }

            // メールアドレスの厳密な検証
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            // 明らかに無効なパターンをチェック
            const isInvalidEmail =
              !email ||
              email.length < 5 || // 最低5文字（a@b.c）
              !email.includes('@') ||
              !email.includes('.') ||
              /^[0-9]+$/.test(email) || // 数字のみ（000など）
              /^[-]+$/.test(email) || // ハイフンのみ
              email === '-' ||
              email.startsWith('000') ||
              email.startsWith('-');

            if (isInvalidEmail || !emailRegex.test(email)) {
              console.log(`Skipping line ${i + index}: 無効なメールアドレス形式 "${email}"`);
              errorCount++;
              return null;
            }

            // 必須フィールドチェック（メールアドレスと会社名）
            if (!email || !company) {
              console.log(`Skipping line ${i + index}: メールアドレスまたは法人名称がありません`);
              console.log('Row keys:', Object.keys(row));
              console.log('email:', email, 'company:', company);
              errorCount++;
              return null;
            }

            let industryId: number | null = null;
            let sectorId: number | null = null;

            // 業界の処理
            if (industry) {
              if (industryCache.has(industry)) {
                industryId = industryCache.get(industry)!;
              } else {
                const industryRecord = await prisma.industry.upsert({
                  where: { name: industry },
                  update: {},
                  create: { name: industry },
                });
                industryId = industryRecord.id;
                industryCache.set(industry, industryId);
              }
            }

            // 業種の処理
            if (sector && industryId) {
              const sectorKey = `${sector}-${industryId}`;
              if (sectorCache.has(sectorKey)) {
                sectorId = sectorCache.get(sectorKey)!;
              } else {
                const sectorRecord = await prisma.sector.upsert({
                  where: {
                    name_industryId: {
                      name: sector,
                      industryId: industryId,
                    },
                  },
                  update: {},
                  create: {
                    name: sector,
                    industryId: industryId,
                  },
                });
                sectorId = sectorRecord.id;
                sectorCache.set(sectorKey, sectorId);
              }
            }

            return {
              name: name || company, // 代表者名がない場合は会社名を使用
              email: email,
              company: company || null,
              position: position || null,
              industryId: industryId,
              sectorId: sectorId,
            };
          } catch (err) {
            console.error(`Error processing line ${i + index}:`, err);
            errorCount++;
            return null;
          }
        })
      );

      // nullを除外してデータベースに挿入
      const validCustomers = customersToInsert.filter(c => c !== null);

      // 1件ずつupsert（メールアドレスが重複している場合は更新）
      for (const customer of validCustomers as any[]) {
        try {
          await prisma.customer.upsert({
            where: { email: customer.email },
            update: {
              name: customer.name,
              company: customer.company,
              position: customer.position,
              industryId: customer.industryId,
              sectorId: customer.sectorId,
            },
            create: customer,
          });
          successCount++;
        } catch (err) {
          console.error('Customer upsert error:', err, customer.email);
          errorCount++;
        }
      }

      processedCount += batch.length;
    }

    console.log('=== Import Summary ===');
    console.log('Processed:', processedCount);
    console.log('Success:', successCount);
    console.log('Errors:', errorCount);
    console.log('Industries:', industryCache.size);
    console.log('Sectors:', sectorCache.size);

    // インポート履歴を保存
    await prisma.importHistory.create({
      data: {
        fileName: file.name,
        totalRows: dataRows.length,
        successCount: successCount,
        errorCount: errorCount,
        industriesCount: industryCache.size,
        sectorsCount: sectorCache.size,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${successCount}件のデータをインポートしました`,
      processed: processedCount,
      successCount: successCount,
      errors: errorCount,
      industries: industryCache.size,
      sectors: sectorCache.size,
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'インポート処理中にエラーが発生しました',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
