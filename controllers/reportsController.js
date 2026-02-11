const Report = require('../models/Report');

const getReports = async (req, res) => {
  try {
    let filter = {};
    
    // If user is not admin, return only their reports
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user._id;
    }
    
    // Fetch reports with populated references
    const reports = await Report.find(filter)
      .populate('createdBy', 'email')
      .populate('relatedTask', 'title')
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createReport = async (req, res) => {
  try {
    const { title, description, category, relatedTask } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Title, description, and category are required' });
    }
    
    const report = new Report({
      title,
      description,
      category,
      createdBy: req.user._id,
      relatedTask: relatedTask || null
    });
    
    await report.save();
    
    // Populate references for response
    await report.populate('createdBy', 'email');
    await report.populate('relatedTask', 'title');
    
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can delete reports' });
    }
    
    const report = await Report.findByIdAndDelete(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = { getReports, createReport, deleteReport };
