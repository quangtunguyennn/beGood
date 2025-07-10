
// --- Schedule Manager Backend (Express + NeDB) ---
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Datastore = require('nedb');

const app = express();
const port = 3001;
const termsDb = new Datastore({ filename: './terms.db', autoload: true });
const schedulesDb = new Datastore({ filename: './schedules.db', autoload: true });

app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- TERMS ---
// List all terms
app.get('/api/terms', (req, res) => {
  termsDb.find({}).sort({ createdAt: 1 }).exec((err, terms) => {
    if (err) return res.status(500).json({ error: err });
    res.json(terms);
  });
});
// Get a single term
app.get('/api/terms/:id', (req, res) => {
  termsDb.findOne({ _id: req.params.id }, (err, term) => {
    if (err) return res.status(500).json({ error: err });
    if (!term) return res.status(404).json({ error: 'Term not found' });
    res.json(term);
  });
});
// Create a new term
app.post('/api/terms', (req, res) => {
  const { name, termLength, startDate } = req.body;
  if (!name || typeof name !== 'string' || !startDate || typeof startDate !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid name or startDate' });
  }
  const parsedLength = parseInt(termLength, 10);
  if (isNaN(parsedLength) || parsedLength < 1 || parsedLength > 52) {
    return res.status(400).json({ error: 'Invalid termLength (must be 1-52)' });
  }
  const term = {
    name,
    termLength: parsedLength,
    startDate,
    createdAt: new Date().toISOString()
  };
  termsDb.insert(term, (err, newTerm) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json(newTerm);
  });
});

// --- SCHEDULES ---
// List all schedules for a term
app.get('/api/schedules', (req, res) => {
  const { termId } = req.query;
  const query = termId ? { termId } : {};
  schedulesDb.find(query).sort({ week: 1, startTime: 1 }).exec((err, schedules) => {
    if (err) return res.status(500).json({ error: err });
    res.json(schedules);
  });
});
// Create a schedule
app.post('/api/schedules', (req, res) => {
  const { name, instructor, startTime, endTime, days, date, week, notice, termId } = req.body;
  if (!name || !instructor || !startTime || !endTime || !Array.isArray(days) || !date || !week || !termId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const schedule = {
    name, instructor, startTime, endTime, days, date, week, notice: notice || '', termId
  };
  schedulesDb.insert(schedule, (err, newSchedule) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.status(201).json(newSchedule);
  });
});
// Update a schedule's notice
app.put('/api/schedules/:id', (req, res) => {
  const { notice } = req.body;
  schedulesDb.update({ _id: req.params.id }, { $set: { notice } }, {}, (err, num) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ updated: num });
  });
});
// Delete a schedule
app.delete('/api/schedules/:id', (req, res) => {
  schedulesDb.remove({ _id: req.params.id }, {}, (err, num) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ deleted: num });
  });
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(port, () => {
  console.log(`Schedule backend running at http://localhost:${port}`);
});