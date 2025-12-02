// models/TaskType.js
const mongoose = require("mongoose");

/**
 * TaskType Schema
 * Represents one of the three main task types:
 * Task1: Self-introduction
 * Task2: Scenario dialogues
 * Task3: Topic argumentation
 */

const taskTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
});

module.exports = mongoose.model("TaskType", taskTypeSchema);