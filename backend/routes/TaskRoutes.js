const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const TaskItem = require("../models/TaskItem");
const TaskType = require("../models/TaskType");
const Category = require("../models/Category");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// -----------------------
// Multer Upload Setup
// -----------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "images") cb(null, "uploads/images");
    else if (file.fieldname === "audios") cb(null, "uploads/audios");
    else cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===============================
// 🟢 GET all task types
// URL: GET /api/tasks/types/all
// ===============================
router.get("/types/all", protect, async (req, res) => {
  try {
    const types = await TaskType.find();
    res.json(types);
  } catch (err) {
    console.error("❌ Fetch task types error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🟢 AUTO-CREATE CATEGORY (User typed)
// URL: POST /api/tasks/categories
// ===============================
router.post("/categories", protect, async (req, res) => {
  try {
    const { name, taskType } = req.body;

    if (!name || !taskType) {
      return res.status(400).json({ message: "Category name + taskType required" });
    }

    // Must be valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskType)) {
      return res.status(400).json({ message: "Invalid TaskType ID" });
    }

    // Check if exists
    let existing = await Category.findOne({ name, taskType });

    if (existing) return res.json(existing);

    // Create new
    const newCategory = new Category({
      name,
      taskType,
    });

    await newCategory.save();
    return res.status(201).json(newCategory);

  } catch (err) {
    console.error("❌ Create category error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🟢 Get ALL categories
// URL: GET /api/tasks/categories/all
// ===============================
router.get("/categories/all", protect, async (req, res) => {
  try {
    const categories = await Category.find().populate("taskType", "name");
    res.json(categories);
  } catch (err) {
    console.error("❌ Fetch categories error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🟢 GET all tasks for logged in user
// ===============================
router.get("/", protect, async (req, res) => {
  try {
    const tasks = await TaskItem.find({ userId: req.user.id })
      .populate("taskType", "name")
      .populate("category", "name");

    res.json(tasks);
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🟢 GET single task
// ===============================
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid task ID" });

    const task = await TaskItem.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
      .populate("taskType", "name")
      .populate("category", "name");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.json(task);
  } catch (err) {
    console.error("❌ Error fetching task:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ===============================
// 🟢 CREATE TASK
// ===============================
router.post("/", protect, async (req, res) => {
  try {
    const { title, taskType, category } = req.body;

    if (!title || !taskType || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newTask = new TaskItem({
      userId: req.user.id,
      title,
      taskType,
      category,
    });

    await newTask.save();

    const saved = await TaskItem.findById(newTask._id)
      .populate("taskType", "name")
      .populate("category", "name");

    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating task:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================================================================
// 🟡 UPDATE & DELETE IMAGE/AUDIO + DELETE TASK (your original code)
// =======================================================================


// 🔄 UPDATE TASK (unchanged)
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "audios", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id))
        return res.status(400).json({ message: "Invalid task ID" });

      const task = await TaskItem.findOne({
        _id: req.params.id,
        userId: req.user.id,
      });
      if (!task) return res.status(404).json({ message: "Task not found" });

      const {
        title,
        masteryLevel,
        textBoxes,
        taskNotes,
        highlightNotes,
        showNavigation,
      } = req.body;

      if (title !== undefined) task.title = title;
      if (masteryLevel !== undefined) task.masteryLevel = Number(masteryLevel);
      if (showNavigation !== undefined)
        task.showNavigation = showNavigation === "true";

      if (textBoxes) {
        try {
          const parsedTextBoxes = JSON.parse(textBoxes);
          if (Array.isArray(parsedTextBoxes)) {
            task.textBoxes = parsedTextBoxes.map((tb) => ({
              text: tb.text || "",
              createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
              updatedAt: new Date(),
            }));
          }
        } catch (err) {
          console.warn("❌ textBoxes JSON parse failed:", err.message);
        }
      }

      if (taskNotes) {
        try {
          task.taskNotes = JSON.parse(taskNotes);
        } catch {}
      }
      if (highlightNotes) {
        try {
          task.highlightNotes = JSON.parse(highlightNotes);
        } catch {}
      }

      const newImages =
        req.files?.images?.map((f) => `/uploads/images/${f.filename}`) || [];
      task.imagePaths = [...(task.imagePaths || []), ...newImages];

      const newAudios =
        req.files?.audios?.map((f) => `/uploads/audios/${f.filename}`) || [];
      task.audioPaths = [...(task.audioPaths || []), ...newAudios];

      await task.save();

      const updatedTask = await TaskItem.findById(task._id)
        .populate("taskType", "name")
        .populate("category", "name");

      res.json(updatedTask);
    } catch (err) {
      console.error("❌ Error updating task:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
);


// ❌ DELETE ENTIRE TASK
router.delete("/:id", protect, async (req, res) => {
  try {
    const deletedTask = await TaskItem.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedTask)
      return res.status(404).json({ message: "Task not found" });

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("❌ Delete task error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ❌ DELETE IMAGE
router.delete("/:id/image/:index", protect, async (req, res) => {
  try {
    const task = await TaskItem.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    const index = parseInt(req.params.index);
    const filePath = task.imagePaths[index];

    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    task.imagePaths.splice(index, 1);
    await task.save();

    res.json({ imagePaths: task.imagePaths });
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ❌ DELETE AUDIO
router.delete("/:id/audio/:index", protect, async (req, res) => {
  try {
    const task = await TaskItem.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    const index = parseInt(req.params.index);
    const filePath = task.audioPaths[index];

    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    task.audioPaths.splice(index, 1);
    await task.save();

    res.json({
      message: "Audio deleted successfully",
      audioPaths: task.audioPaths,
    });
  } catch (err) {
    console.error("❌ Error deleting audio:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
