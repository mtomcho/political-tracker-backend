const axios = require('axios');
const Database = require('better-sqlite3');

const OPENSTATES_API_KEY = '21343d5a-b17e-49b3-b5d4-56301f303c95';
const API_BASE = 'https://openstates.org/graphql';
const db = new Database('colorado.db');

async function syncLegislators(state = 'Colorado') {
  console.log(`\n📥 Syncing legislators for ${state}...`);
  
  // Simplified query - just get people directly
  const query = `
    query {
      people(jurisdiction: "${state}", memberOf: "legislature") {
        edges {
          node {
            id
            name
            email
            image
            currentMemberships {
              post {
                label
              }
            }
            partyMemberships: currentMemberships(classification: "party") {
              organization {
                name
              }
            }
          }
        }
      }
    }
  `;
  
  try {
    const response = await axios.post(API_BASE, 
      { query },
      { headers: { 'X-API-KEY': OPENSTATES_API_KEY } }
    );
    
    if (response.data.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(response.data.errors, null, 2));
      return;
    }
    
    const people = response.data.data.people.edges;
    console.log(`Found ${people.length} legislators`);
    
    let added = 0;
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO politicians 
      (external_id, name, position, party, state, email, photo_url, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    people.forEach(edge => {
      const person = edge.node;
      const position = person.currentMemberships?.[0]?.post?.label || 'State Legislator';
      const party = person.partyMemberships?.[0]?.organization?.name || 'Unknown';
      
      insertStmt.run(
        person.id,
        person.name,
        position,
        party,
        'CO',
        person.email || null,
        person.image || null,
        1
      );
      added++;
      console.log(`  ✓ ${person.name}`);
    });
    
    console.log(`✅ Added/updated ${added} legislators`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function syncBills(state = 'Colorado', session = '2025 Regular Session') {
  console.log(`\n📥 Syncing bills for ${state} ${session}...`);
  
  const query = `
    query {
      bills(jurisdiction: "${state}", session: "${session}", first: 30) {
        edges {
          node {
            id
            identifier
            title
            classification
            updatedAt
            abstracts {
              abstract
            }
          }
        }
      }
    }
  `;
  
  try {
    const response = await axios.post(API_BASE,
      { query },
      { headers: { 'X-API-KEY': OPENSTATES_API_KEY } }
    );
    
    if (response.data.errors) {
      console.error('❌ GraphQL errors:', JSON.stringify(response.data.errors, null, 2));
      return;
    }
    
    const bills = response.data.data.bills.edges;
    console.log(`Found ${bills.length} bills`);
    
    let added = 0;
    const insertBill = db.prepare(`
      INSERT OR IGNORE INTO bills 
      (external_id, bill_number, title, description, status, introduced_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    bills.forEach(edge => {
      const bill = edge.node;
      const result = insertBill.run(
        bill.id,
        bill.identifier,
        bill.title,
        bill.abstracts?.[0]?.abstract || bill.title,
        'Introduced',
        bill.updatedAt.split('T')[0]
      );
      if (result.changes > 0) {
        added++;
        console.log(`  ✓ ${bill.identifier}`);
      }
    });
    
    console.log(`✅ Added ${added} new bills`);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🏛️  OpenStates Data Sync Starting...\n');
  console.log('═══════════════════════════════════════\n');
  
  await syncLegislators('Colorado');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await syncBills('Colorado');
  
  console.log('\n═══════════════════════════════════════');
  console.log('✅ Sync complete!');
  console.log('\n📊 Database Summary:');
  const realPols = db.prepare("SELECT COUNT(*) as c FROM politicians WHERE external_id IS NOT NULL AND external_id != ''").get().c;
  const realBills = db.prepare("SELECT COUNT(*) as c FROM bills WHERE external_id IS NOT NULL AND external_id != ''").get().c;
  console.log('Real legislators:', realPols);
  console.log('Real bills:', realBills);
  
  process.exit(0);
}

main();