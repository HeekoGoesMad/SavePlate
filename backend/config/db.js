const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas using the URI from environment variables.
 * Exits the process with code 1 if the connection fails.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Server will start without database. Some endpoints may fail.');
    // Don't exit — let the server start so routes can still be tested
  }
};

module.exports = connectDB;
