const axios = require('axios');
const fs = require('fs');

const API_URL = 'https://political-tracker-backend.onrender.com';

async function uploadData() {
  console.log('📤 Uploading bills and votes to Render...\n');

  // Read the exported data
  const bills = JSON.parse(fs.readFileSync('bills-export.json', 'utf8'));
  const votes = JSON.parse(fs.readFileSync('votes-export.json', 'utf8'));

  console.log(`Found ${bills.length} bills and ${votes.length} votes\n`);

  // Upload bills
  console.log('Uploading bills...');
  for (const bill of bills) {
    try {
      await axios.post(`${API_URL}/api/bills`, bill);
      console.log('✓ Added:', bill.bill_number);
    } catch (err) {
      console.log('✗ Error:', bill.bill_number, err.response?.status);
    }
  }

  // Upload votes
  console.log('\nUploading votes...');
  let count = 0;
  for (const vote of votes) {
    try {
      await axios.post(`${API_URL}/api/votes`, vote);
      count++;
      if (count % 100 === 0) console.log(`Uploaded ${count} votes...`);
    } catch (err) {
      // Silently skip errors
    }
  }

  console.log(`\n✅ Done! Uploaded ${count} votes`);
}

uploadData();

