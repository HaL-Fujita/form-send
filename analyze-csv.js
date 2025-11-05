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

console.log('=== CSV分析結果 ===');
console.log('総行数:', rows.length);
console.log('列名:', parseResult.meta.fields);
console.log('');

// 業種の分析
const industryCount = new Map();
rows.forEach(row => {
  const industry = (row['業種'] || '').trim();
  if (industry) {
    industryCount.set(industry, (industryCount.get(industry) || 0) + 1);
  }
});

console.log('=== 業種の種類数:', industryCount.size, '===');
const sortedIndustries = Array.from(industryCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

console.log('業種トップ20:');
sortedIndustries.forEach(([name, count]) => {
  console.log(`  ${count}件: "${name}"`);
});

console.log('');

// 業種(中分類1)の分析
const sectorCount = new Map();
rows.forEach(row => {
  const sector = (row['業種(中分類1)'] || '').trim();
  if (sector) {
    sectorCount.set(sector, (sectorCount.get(sector) || 0) + 1);
  }
});

console.log('=== 業種(中分類1)の種類数:', sectorCount.size, '===');
const sortedSectors = Array.from(sectorCount.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 30);

console.log('業種(中分類1)トップ30:');
sortedSectors.forEach(([name, count]) => {
  console.log(`  ${count}件: "${name}"`);
});
