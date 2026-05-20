const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
let databaseInitPromise;

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

const initDatabase = async () => {
  if (!databaseInitPromise) {
    databaseInitPromise = (async () => {
      await connectDB();

      // Seed recipes if needed
      try {
        const seedRecipes = require('./utils/seedRecipes');
        await seedRecipes();
      } catch (seedErr) {
        console.error('⚠️ Recipe seeding skipped or failed:', seedErr.message);
      }
    })();
  }

  return databaseInitPromise;
};

app.use(async (req, res, next) => {
  try {
    await initDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// Basic Route
app.get('/', (req, res) => {
  res.json({
    message: 'SavePlate API is running.',
    health: '/api/health',
  });
});

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
app.use('/api/recipes',       require('./routes/recipeRoutes'));

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

const startServer = async () => {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = app;
