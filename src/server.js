
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database('colorado.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS politicians (
    id INTEGER PRIMARY KEY,
    name TEXT,
    position TEXT,
    party TEXT
  )
`);

const count = db.prepare('SELECT COUNT(*) as count FROM politicians').get();
if (count.count === 0) {
  db.prepare(`INSERT INTO politicians (name, position, party) VALUES 
    ('Jared Polis', 'Governor', 'Democrat'),
    ('Lauren Boebert', 'U.S. Representative', 'Republican'),
    ('Michael Bennet', 'U.S. Senator', 'Democrat')
  `).run();
}

app.get('/api/politicians', (req, res) => {
  const politicians = db.prepare('SELECT * FROM politicians').all();
  res.json({ data: politicians });
});
// Get politician's voting record
app.get('/api/politicians/:id/votes', (req, res) => {
  const { id } = req.params;
  const votes = db.prepare(`
    SELECT 
      v.vote,
      b.bill_number,
      b.title,
      b.description,
      b.status,

// Add a politician
app.post('/api/politicians', (req, res) => {
  try {
    const { name, position, party, election_year, state } = req.body;
    const stmt = db.prepare('INSERT INTO politicians (name, position, party, election_year, state) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, position, party, election_year, state);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});      b.introduced_date,
      b.pros,
      b.cons,
      b.vote_rounds
    FROM votes v
    JOIN bills b ON v.bill_id = b.id
    WHERE v.politician_id = ?
    ORDER BY b.introduced_date DESC
  `).all(id);
  res.json({ data: votes });
});

// Get all bills
app.get('/api/bills', (req, res) => {
  const bills = db.prepare('SELECT * FROM bills ORDER BY introduced_date DESC').all();
  res.json({ data: bills });
});

// Get votes on a specific bill
app.get('/api/bills/:id/votes', (req, res) => {
  const { id } = req.params;
  const votes = db.prepare(`
    SELECT 
      p.name,
      p.party,
      p.position,
      v.vote
    FROM votes v
    JOIN politicians p ON v.politician_id = p.id
    WHERE v.bill_id = ?
    ORDER BY p.name
  `).all(id);
  res.json({ data: votes });
});// Add a bill
app.post('/api/bills', (req, res) => {
  try {
    const { bill_number, title, description, status, introduced_date, pros, cons, vote_rounds } = req.body;
    const stmt = db.prepare('INSERT OR IGNORE INTO bills (bill_number, title, description, status, introduced_date, pros, cons, vote_rounds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(bill_number, title, description, status, introduced_date, pros, cons, vote_rounds);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a vote
app.post('/api/votes', (req, res) => {
  try {
    const { politician_id, bill_id, vote } = req.body;
    const stmt = db.prepare('INSERT OR IGNORE INTO votes (politician_id, bill_id, vote) VALUES (?, ?, ?)');
    const result = stmt.run(politician_id, bill_id, vote);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.listen(3000, () => {
  console.log('✅ Backend running on http://localhost:3000');
});
