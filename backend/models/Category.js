// models/Category.js
const mongoose = require("mongoose");

/**
 * Category Schema
 * Represents subcategories under each task type
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    taskType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskType",
      required: true,
    },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
