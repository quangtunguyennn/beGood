const express = require('express');
const Datastore = require('nedb');
const router = express.Router();

const db = new Datastore({ filename: './schedules.db', autoload: true });

// Get all schedules
router.get('/', (req, res) => {
  db.find({}, (err, docs) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(docs);
    }
  });
});

// Create a new schedule
router.post('/', (req, res) => {
  const newSchedule = req.body;
  db.insert(newSchedule, (err, newDoc) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json(newDoc);
    }
  });
});

module.exports = router;
