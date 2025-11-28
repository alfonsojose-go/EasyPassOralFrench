const path = require("path");
const fs = require("fs");
const TaskItem = require("../models/TaskItem");

// ---------- Get Tasks ----------
exports.getTasks = async (req, res) => {
  try {
    const tasks = await TaskItem.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Get Single Task ----------
exports.getTask = async (req, res) => {
  try {
    const task = await TaskItem.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Create Task ----------
exports.createTask = async (req, res) => {
  try {
    const task = await TaskItem.create(req.body);
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Update Task ----------
exports.updateTask = async (req, res) => {
  try {
    const task = await TaskItem.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.set(req.body);

    if (!task.imagePaths) task.imagePaths = [];
    if (!task.audioPaths) task.audioPaths = [];

    if (req.files) {
      req.files.forEach((f) => {
        if (f.mimetype.startsWith("image/")) task.imagePaths.push("/" + f.path);
        else if (f.mimetype.startsWith("audio/"))
          task.audioPaths.push("/" + f.path);
      });
    }

    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Delete Task ----------
exports.deleteTask = async (req, res) => {
  try {
    await TaskItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Delete successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Delete Audio ----------
exports.deleteAudioByIndex = async (req, res) => {
  try {
    const task = await TaskItem.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const index = parseInt(req.params.audioIndex);
    if (isNaN(index) || !task.audioPaths[index])
      return res.status(400).json({ message: "Invalid index" });

    const filePath = task.audioPaths[index];
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    task.audioPaths.splice(index, 1);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- Delete Image ----------
exports.deleteImageByIndex = async (req, res) => {
  try {
    const task = await TaskItem.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const index = parseInt(req.params.imageIndex);
    if (isNaN(index) || !task.imagePaths[index])
      return res.status(400).json({ message: "Invalid index" });

    const filePath = task.imagePaths[index];
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    task.imagePaths.splice(index, 1);
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
