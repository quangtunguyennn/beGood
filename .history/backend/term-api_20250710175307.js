const express = require('express');
const Datastore = require('nedb');
const router = express.Router();

const db = new Datastore({ filename: './terms.db', autoload: true });

// Get all terms
router.get('/', (req, res) => {
  db.find({}, (err, docs) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(docs);
    }
  });
});

// Create a new term
router.post('/', (req, res) => {
  const newTerm = req.body;
  db.insert(newTerm, (err, newDoc) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).json(newDoc);
    }
  });
});

module.exports = router;
