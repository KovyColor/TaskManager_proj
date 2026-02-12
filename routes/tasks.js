const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Helper middleware for optional authentication
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    } catch (err) {
      // Silent fail - continue without user
    }
  }
  next();
};

// GET /api/tasks - with optional authentication for visibility filtering
router.get('/', optionalAuth, taskController.getTasks);
// GET /api/tasks/recently-viewed - authenticated users only
router.get('/recently-viewed/list', authMiddleware, taskController.getRecentlyViewedTasks);
// GET /api/tasks/:id - public, but optionally authenticated for tracking
router.get('/:id', optionalAuth, taskController.getTaskById);

// POST /api/tasks - admin only
router.post('/', authMiddleware, adminMiddleware, taskController.createTask);
// PUT /api/tasks/:id - admin only
router.put('/:id', authMiddleware, adminMiddleware, taskController.updateTask);
// DELETE /api/tasks/:id - admin only
router.delete('/:id', authMiddleware, adminMiddleware, taskController.deleteTask);

module.exports = router;
