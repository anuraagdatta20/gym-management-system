require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api', require('./routes/extra'));   // attendance, booking, weight log, stats
app.use('/api', require('./routes/crud'));    // generic CRUD for all other resources

app.get('/', (req, res) => res.send('Gym Management API running'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log('Server on port ' + (process.env.PORT || 5000)));
  })
  .catch(err => console.error('DB connection failed:', err.message));
