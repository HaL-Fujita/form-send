const fs = require('fs');

// Read the CSV file
const csvContent = fs.readFileSync('./sample-customers.csv', 'utf-8');
const lines = csvContent.trim().split('\n');

console.log('=== CSV Debug ===');
console.log('Total lines:', lines.length);
console.log('\n--- First line (header) ---');
console.log('Raw:', lines[0]);
console.log('Length:', lines[0].length);
console.log('Char codes:', Array.from(lines[0].substring(0, 10)).map(c => c.charCodeAt(0)));

// Parse header
const firstLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM
const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));

console.log('\n--- Parsed headers ---');
headers.forEach((h, idx) => {
  console.log(`[${idx}] "${h}" (length: ${h.length})`);
});

// Parse first data line
console.log('\n--- First data line ---');
console.log('Raw:', lines[1]);

const values = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));
const row = {};
headers.forEach((header, idx) => {
  row[header] = values[idx] || '';
});

console.log('\n--- Parsed row object ---');
console.log('Keys:', Object.keys(row));
console.log('row.name:', row.name);
console.log('row.email:', row.email);
console.log('row.company:', row.company);
console.log('\n--- Validation check ---');
console.log('!row.name:', !row.name);
console.log('!row.email:', !row.email);
console.log('Would fail validation:', !row.name || !row.email);
