// Assignment Manager backend API
const express = require('express');
const Datastore = require('nedb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4002;

// DB setup
const db = new Datastore({ filename: path.join(__dirname, 'assignments.db'), autoload: true });

app.use(cors());
app.use(express.json());

// Get all assignments
app.get('/api/assignments', (req, res) => {
  db.find({}).sort({ dueDate: 1 }).exec((err, docs) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(docs);
  });
});

// Add assignment
app.post('/api/assignments', (req, res) => {
  const { title, dueDate, done } = req.body;
  if (!title || !dueDate) return res.status(400).json({ error: 'Missing fields' });
  const assignment = { title, dueDate, done: !!done };
  db.insert(assignment, (err, newDoc) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.status(201).json(newDoc);
  });
});

// Delete assignment by id
app.delete('/api/assignments/:id', (req, res) => {
  db.remove({ _id: req.params.id }, {}, (err, numRemoved) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (numRemoved === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  });
});

// Remove all assignments marked as done
app.delete('/api/assignments', (req, res) => {
  db.remove({ done: true }, { multi: true }, (err, numRemoved) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ removed: numRemoved });
  });
});

// Update assignment (mark done/undone)
app.patch('/api/assignments/:id', (req, res) => {
  const { done } = req.body;
  db.update({ _id: req.params.id }, { $set: { done: !!done } }, {}, (err, numReplaced) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (numReplaced === 0) return res.status(404).json({ error: 'Not found' });
    db.findOne({ _id: req.params.id }, (err, doc) => {
      if (err || !doc) return res.status(500).json({ error: 'DB error' });
      res.json(doc);
    });
  });
});

// Notifications (in-memory, not persisted)
let notifications = [];

app.get('/api/notices', (req, res) => {
  res.json(notifications);
});

app.post('/api/notices', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });
  notifications.push(message);
  res.status(201).json({ success: true });
});

app.delete('/api/notices', (req, res) => {
  notifications = [];
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Assignment Manager API running on port ${PORT}`);
});
