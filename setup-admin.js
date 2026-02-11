const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete all users
    await User.deleteMany({});
    console.log('Cleared all users');

    // Create admin user
    const admin = new User({
      email: 'admin@test.com',
      password: '123456',
      role: 'admin'
    });

    await admin.save();
    console.log('   Admin user created:');
    console.log('   Email: admin@test.com');
    console.log('   Password: 123456');
    console.log('   Role: admin');

    // Disconnect
    await mongoose.disconnect();
    console.log('\n Setup complete! You can now log in with these credentials.');
  } catch (err) {
    console.error(' Error:', err.message);
    process.exit(1);
  }
}

setupAdmin();
