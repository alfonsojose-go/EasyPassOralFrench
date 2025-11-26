const mongoose = require("mongoose");

/**
 * TaskItem Schema
 * Unified schema for Task1, Task2, Task3.
 * Mastery levels replace the old validCount.
 * Each TaskItem belongs to a specific user.
 */
const taskItemSchema = new mongoose.Schema(
  {
    // User ownership
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Basic information
    title: { type: String, required: true },
    taskType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskType",
      required: true,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },

    // Text input / drafts
    textBoxes: [
      {
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date },
      },
    ],
    maxTextBoxes: { type: Number, default: 1 },
    grammarFeedback: [{ type: String }],

    // Text tools
    highlightNotes: [{ type: String }],

    // Topic images
    imagePaths: [{ type: String }],
    showNavigation: { type: Boolean, default: false },

    // Audio recordings
    audioPaths: [{ type: String }],
    maxAudioRecordings: { type: Number, default: 3 },
    recordingTimeLimit: { type: Number, default: 120 },
    replacementAllowed: { type: Boolean, default: true },

    // Mastery level (replaces validCount)
    // 0=New, 1=Familiar, 2=Practicing, 3=Good, 4=Mastered
    masteryLevel: { type: Number, enum: [0, 1, 2, 3, 4], default: 0 },

    // Optional task notes
    taskNotes: [{ type: String }],
  },
  { timestamps: true }
);

// Export the model (CommonJS)
const TaskItem = mongoose.model("TaskItem", taskItemSchema);
module.exports = TaskItem;
