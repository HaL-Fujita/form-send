const fs = require('fs');
const Papa = require('papaparse');

const csvPath = './通信業.xlsx - シート1.csv';
const text = fs.readFileSync(csvPath, 'utf-8');

const parseResult = Papa.parse(text, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header) => header.trim().replace(/^\uFEFF/, ''),
});

const rows = parseResult.data;

// 業種(中分類1)を全件集計
const sectorCount = new Map();
rows.forEach(row => {
  const sector = (row['業種(中分類1)'] || '').trim();
  if (sector) {
    sectorCount.set(sector, (sectorCount.get(sector) || 0) + 1);
  }
});

console.log('=== 業種(中分類1)の完全リスト（全45種類） ===');
console.log('総行数:', rows.length);
console.log('');

const sortedSectors = Array.from(sectorCount.entries())
  .sort((a, b) => b[1] - a[1]);

sortedSectors.forEach(([name, count], index) => {
  const percentage = ((count / rows.length) * 100).toFixed(1);
  console.log(`${index + 1}. ${name}: ${count}件 (${percentage}%)`);
});

console.log('');
console.log('=== 10種類に集約する案 ===');
console.log('1. 通信サービス業 (固定・移動・附帯) - 3411件');
console.log('2. 通信設備工事業 - 743件');
console.log('3. IT・情報サービス業 - 490件');
console.log('4. インターネット関連サービス - 220件');
console.log('5. 放送業 - 110件');
console.log('6. 通信機器製造業 - 90件');
console.log('7. 専門サービス業 - 86件');
console.log('8. 広告・マーケティング - 34件');
console.log('9. 人材サービス - 32件');
console.log('10. その他通信関連業 - 残り全て');
