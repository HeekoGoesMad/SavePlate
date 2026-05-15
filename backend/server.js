const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the SavePlate API!' });
});

// Health-check route (useful for testing the DB connection)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Connect to MongoDB, then start the server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
