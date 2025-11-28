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
// 🔹 multer file store configuration
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

// =======================
// ✅ Get the current user's tasks
// =======================
router.get("/", protect, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const tasks = await TaskItem.find({ userId: userObjectId })
      .populate("taskType", "name")
      .populate("category", "name");

    res.json(tasks);
  } catch (err) {
    console.error("❌ Error fetching tasks:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// ✅ Get the taskItem information
// =======================
router.get("/:id", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id))
      return res.status(400).json({ message: "Invalid task ID" });

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const taskObjectId = new mongoose.Types.ObjectId(req.params.id);

    const task = await TaskItem.findOne({
      _id: taskObjectId,
      userId: userObjectId,
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

// =======================
// 🔹Update Task (Supports File Upload + ObjectId Validation)
// =======================
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

      // 🔹 Handle text part

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

      // 🔹 处理新上传图片
      const newImages =
        req.files?.images?.map((f) => `/uploads/images/${f.filename}`) || [];
      task.imagePaths = [...(task.imagePaths || []), ...newImages];

      // 🔹 Handle new recording
      const newAudios =
        req.files?.audios?.map((f) => `/uploads/audios/${f.filename}`) || [];
      task.audioPaths = [...(task.audioPaths || []), ...newAudios];

      // 🔹 save
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
// =======================
// 🔹 Delete image by index
// =======================
router.delete("/:id/image/:index", protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const index = parseInt(req.params.index);

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "Invalid task ID" });

    const task = await TaskItem.findOne({ _id: taskId, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (isNaN(index) || index < 0 || index >= (task.imagePaths?.length || 0))
      return res.status(400).json({ message: "索引无效" });

    // delete the phyquel files
    const filePath = task.imagePaths[index];
    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // delete the element in the array
    task.imagePaths.splice(index, 1);
    await task.save();

    res.json({ imagePaths: task.imagePaths }); // ✅ return JSON
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({ message: "Delete failure: " + err.message });
  }
});
// =======================
// 🔹Delete recording by index
// =======================
router.delete("/:id/audio/:index", protect, async (req, res) => {
  try {
    const taskId = req.params.id;
    const index = parseInt(req.params.index);

    if (!mongoose.Types.ObjectId.isValid(taskId))
      return res.status(400).json({ message: "Invalid task ID" });

    const task = await TaskItem.findOne({ _id: taskId, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (isNaN(index) || index < 0 || index >= (task.audioPaths?.length || 0))
      return res.status(400).json({ message: "索引无效" });

    // find the recording files
    const filePath = task.audioPaths[index];

    // delete the physiquel files
    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // delete the path in array
    task.audioPaths.splice(index, 1);
    await task.save();

    res.json({
      message: "recording delete success",
      audioPaths: task.audioPaths,
    });
  } catch (err) {
    console.error("❌ Error deleting audio:", err);
    res.status(500).json({ message: "delete failure: " + err.message });
  }
});

module.exports = router;
