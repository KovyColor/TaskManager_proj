const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    assignedTo: {
      type: String,
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending"
    },
    deadline: {
      type: Date
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
