const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/users - admin only
router.get('/', authMiddleware, adminMiddleware, userController.getUsers);

module.exports = router;
