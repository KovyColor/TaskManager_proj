const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const categoryRoutes = require('./routes/categories');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');

const app = express();

// Warn if JWT secret is not configured
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  Warning: JWT_SECRET is not set. Authentication will not work until you set it in .env');
}

// =======================
// MIDDLEWARE
// =======================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =======================
// DATABASE CONNECTION
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// =======================
// ROUTES (API)
// =======================
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// Legacy mount for backward compatibility
app.use('/tasks', taskRoutes);

// Debug: list mounted routes and middleware names
try {
  if (app._router && app._router.stack) {
    console.log('Registered routes and middleware:');
    app._router.stack.forEach((layer, i) => {
      try {
        const name = layer.name || (layer.handle && layer.handle.name) || '<anonymous>';
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
          console.log(`#${i}`, methods, layer.route.path, '->', name);
        } else if (layer.name === 'router' || (layer.handle && layer.handle.stack)) {
          console.log(`#${i}`, 'router ->', name);
          const stack = (layer.handle && layer.handle.stack) || layer.stack || [];
          stack.forEach((r, j) => {
            if (r.route && r.route.path) console.log(`  child#${j}`, Object.keys(r.route.methods).join(',').toUpperCase(), r.route.path);
          });
        } else {
          console.log(`#${i}`, 'middleware ->', name);
        }
      } catch (inner) {
        console.log('#'+i, 'error while dumping layer', inner && inner.message);
      }
    });
  }
} catch (err) {
  console.error('Failed to list routes', err);
}

// Global error handler to surface unexpected errors (useful for debugging and production logging)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: err && err.message ? err.message : String(err) });
});

// =======================
// SERVER START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
