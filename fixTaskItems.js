// fixTaskItems.js
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// 🔹 指定你的 .env 文件路径，假设在 backend 文件夹里
dotenv.config({ path: path.resolve(__dirname, "backend/.env") });

// Models
const TaskItem = require("./backend/models/TaskItem");
const TaskType = require("./backend/models/TaskType");
const Category = require("./backend/models/Category");

// 用户 ID
const userId = "691de060758b9ac766ade3a1";

// 测试是否读取到 Mongo URI
console.log("🔹 Mongo URI:", process.env.MONGO_URI);

// 连接 MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// 主函数
const fixTasks = async () => {
  try {
    // 清理该用户现有任务（可选）
    // await TaskItem.deleteMany({ userId });

    // 获取 TaskTypes 和 Categories
    const taskTypes = await TaskType.find({}).lean();
    const categories = await Category.find({}).lean();

    if (!taskTypes.length || !categories.length) {
      console.log(
        "❌ TaskTypes or Categories not found. Please check your DB."
      );
      return;
    }

    const tasksToInsert = [];

    taskTypes.forEach((tt) => {
      // 找出属于这个 TaskType 的 category，取前 6 个
      const cats = categories
        .filter((c) => c.taskType.toString() === tt._id.toString())
        .slice(0, 6);

      cats.forEach((cat) => {
        tasksToInsert.push({
          userId,
          title: `${tt.name} ${cat.name} Example`,
          taskType: tt._id,
          category: cat._id,
          textBoxes: [],
          grammarFeedback: [],
          highlightNotes: [],
          imagePaths: [],
          audioPaths: [],
          taskNotes: [],
          maxTextBoxes: 1,
          maxAudioRecordings: 3,
          recordingTimeLimit: 120,
          replacementAllowed: true,
          masteryLevel: 0,
          showNavigation: false,
        });
      });
    });

    const inserted = await TaskItem.insertMany(tasksToInsert);
    console.log(`✅ ${inserted.length} tasks inserted for user ${userId}`);
  } catch (err) {
    console.error("Seed/fix error:", err);
  } finally {
    mongoose.connection.close();
  }
};

// 运行
fixTasks();
