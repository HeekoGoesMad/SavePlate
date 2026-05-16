const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Basic Route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the SavePlate API!' });
});

// ── Routes ──
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/items',         require('./routes/itemRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/meal-plan',     require('./routes/mealPlanRoutes'));
app.use('/api/donations',     require('./routes/donationRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));

// Health-check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error.' });
});

// Connect to MongoDB, then start the server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

startServer();
