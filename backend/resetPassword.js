const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const db = mongoose.connection.useDb('saveplate_db');
    const users = db.collection('users');
    const hash = await bcrypt.hash('password123', 10);
    const res = await users.updateOne({ email: 'saveplate.official@gmail.com' }, { $set: { password: hash } });
    console.log('Updated users:', res.modifiedCount);
    process.exit(0);
  })
  .catch(console.error);
