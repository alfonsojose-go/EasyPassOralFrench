const express = require("express");
const router = express.Router();
const multer = require("multer");
const auth = require("../middleware/auth");
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  deleteAudioByIndex,
  deleteImageByIndex,
} = require("../controllers/TaskItemController");

// 上传配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) cb(null, "uploads/images");
    else if (file.mimetype.startsWith("audio/")) cb(null, "uploads/audios");
    else cb(new Error("Unsupported file type"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage });

router.use(auth);

// CRUD
router.get("/", getTasks);
router.get("/:id", getTask);
router.post("/", createTask);
router.put("/:id", upload.any(), updateTask);
router.delete("/:id", deleteTask);

// Delete file
router.delete("/:taskId/audio/:audioIndex", deleteAudioByIndex);
router.delete("/:taskId/image/:imageIndex", deleteImageByIndex);

module.exports = router;
