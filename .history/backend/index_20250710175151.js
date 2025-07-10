const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const assignmentRoutes = require('./assignment-api');
const scheduleRoutes = require('./schedule-api');
const termRoutes = require('./term-api');

app.use('/assignments', assignmentRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/terms', termRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
