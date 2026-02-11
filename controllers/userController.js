const User = require('../models/User');

// Get all users (employees and admins)
const getUsers = async (req, res) => {
  try {
    // Find all users and exclude password
    const users = await User.find({})
      .select('-password')
      .lean();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getUsers };
