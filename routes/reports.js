const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/reports - Auth required (returns all for admin, own for user)
router.get('/', authMiddleware, reportsController.getReports);

// POST /api/reports - Auth required (any authenticated user)
router.post('/', authMiddleware, reportsController.createReport);

// DELETE /api/reports/:id - Admin only
router.delete('/:id', authMiddleware, adminMiddleware, reportsController.deleteReport);

module.exports = router;
