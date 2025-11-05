const fs = require('fs');
const path = require('path');

async function testImport() {
  const FormData = require('form-data');
  const form = new FormData();

  const filePath = path.join(__dirname, 'demo_customers.csv');
  const fileStream = fs.createReadStream(filePath);

  form.append('file', fileStream, 'demo_customers.csv');

  try {
    const response = await fetch('http://localhost:3000/api/customers/import', {
      method: 'POST',
      body: form,
    });

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('Status:', response.status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImport();
