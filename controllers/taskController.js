const Task = require('../models/Task');
const User = require('../models/User');

const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getTasks = async (req, res) => {
  try {
    // Extract query parameters
    const { status, search, page = 1, limit = 5 } = req.query;
    
    // Build filter object
    let filter = {};
    
    // Filter by status if provided
    if (status) {
      filter.status = status;
    }
    
    // Search by title OR assignedTo (case-insensitive)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { assignedTo: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query with filters and pagination
    const tasks = await Task.find(filter)
      .populate('category')
      .skip(skip)
      .limit(limitNum);
    
    // Get total count for pagination info
    const total = await Task.countDocuments(filter);
    
    res.json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('category');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Track recently viewed task if user is authenticated
    if (req.user) {
      const userId = req.user._id;
      const taskId = task._id;
      
      // Add task to recentlyViewedTasks, avoiding duplicates, keeping last 5
      const user = await User.findById(userId);
      if (user) {
        // Remove if already exists
        user.recentlyViewedTasks = user.recentlyViewedTasks.filter(
          id => !id.equals(taskId)
        );
        
        // Add to front
        user.recentlyViewedTasks.unshift(taskId);
        
        // Keep only last 5
        if (user.recentlyViewedTasks.length > 5) {
          user.recentlyViewedTasks = user.recentlyViewedTasks.slice(0, 5);
        }
        
        await user.save();
      }
    }
    
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
};

const getRecentlyViewedTasks = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await User.findById(req.user._id).populate('recentlyViewedTasks');
    
    if (!user || !user.recentlyViewedTasks) {
      return res.json([]);
    }
    
    res.json(user.recentlyViewedTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('category');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getRecentlyViewedTasks };
