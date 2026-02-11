const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// GET /api/categories - public
router.get('/', categoryController.getCategories);
// GET /api/categories/:id - public
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - admin only
router.post('/', authMiddleware, adminMiddleware, categoryController.createCategory);
// PUT /api/categories/:id - admin only
router.put('/:id', authMiddleware, adminMiddleware, categoryController.updateCategory);
// DELETE /api/categories/:id - admin only
router.delete('/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;