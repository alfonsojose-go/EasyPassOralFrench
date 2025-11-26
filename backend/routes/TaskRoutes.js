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
// 🔹 multer 文件存储设置
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
// ✅ 获取当前用户的所有任务
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
// ✅ 获取单个任务详情
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
// 🔹 更新任务 (支持文件上传 + ObjectId 验证)
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

      // 🔹 处理文本字段
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

      // 🔹 处理新上传音频
      const newAudios =
        req.files?.audios?.map((f) => `/uploads/audios/${f.filename}`) || [];
      task.audioPaths = [...(task.audioPaths || []), ...newAudios];

      // 🔹 保存
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
// 🔹 删除图片（按索引）
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

    // 删除物理文件
    const filePath = task.imagePaths[index];
    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // 删除数组中的元素
    task.imagePaths.splice(index, 1);
    await task.save();

    res.json({ imagePaths: task.imagePaths }); // ✅ 返回 JSON
  } catch (err) {
    console.error("❌ Error deleting image:", err);
    res.status(500).json({ message: "删除失败: " + err.message });
  }
});
// =======================
// 🔹 删除音频（按索引）
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

    // 找到该音频文件
    const filePath = task.audioPaths[index];

    // 删除物理文件（如果存在）
    if (filePath?.startsWith("/uploads/")) {
      const fullPath = path.join(__dirname, "..", filePath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }

    // 删除数组中对应的音频路径
    task.audioPaths.splice(index, 1);
    await task.save();

    res.json({
      message: "音频删除成功",
      audioPaths: task.audioPaths,
    });
  } catch (err) {
    console.error("❌ Error deleting audio:", err);
    res.status(500).json({ message: "删除失败: " + err.message });
  }
});

module.exports = router;
