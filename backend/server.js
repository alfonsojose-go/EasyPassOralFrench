// server.js
const express = require("express");
const path = require("path"); // Must be required before app.use
const dotenv = require("dotenv");
const cors = require("cors");

// Database connection
const connectDB = require("./config/db");

// Routes
const userRoutes = require("./routes/LoginRoutes");
const taskRoutes = require("./routes/TaskRoutes");
const listRoutes = require("./routes/ListRoutes");

// Load .env configuration
dotenv.config();

// Initialize express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse form data

// Static folder - used for accessing uploaded files from frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/lists", listRoutes);

// Connect to database
connectDB();

// Base route test
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// 专业的语法检查API路由
app.post("/api/grammar-check", async (req, res) => {
  try {
    const { text, language = "fr" } = req.body;

    // 输入验证
    if (!text || typeof text !== "string") {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Text parameter is required and must be a string",
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: "TEXT_TOO_LONG",
        message: "Text exceeds maximum length of 10000 characters",
      });
    }

    console.log(
      `[GrammarCheck] Processing ${text.length} chars for language: ${language}`
    );

    // 使用专业的LanguageTool API
    const languageToolResponse = await fetch(
      "https://api.languagetool.org/v2/check",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "YourApp/1.0.0",
        },
        body: new URLSearchParams({
          text: text,
          language: language,
          enabledOnly: "false",
          level: "default",
        }),
        timeout: 10000, // 10秒超时
      }
    );

    if (!languageToolResponse.ok) {
      throw new Error(
        `LanguageTool API responded with status: ${languageToolResponse.status}`
      );
    }

    const data = await languageToolResponse.json();

    // 标准化响应格式
    const standardizedResponse = {
      success: true,
      data: {
        originalText: text,
        language: language,
        matches: data.matches.map((match) => ({
          message: match.message,
          shortMessage: match.shortMessage,
          replacements: match.replacements.slice(0, 5), // 限制建议数量
          context: {
            text: match.context.text,
            offset: match.context.offset,
            length: match.context.length,
          },
          offset: match.offset,
          length: match.length,
          rule: {
            id: match.rule.id,
            description: match.rule.description,
            category: match.rule.category.name,
          },
        })),
        statistics: {
          totalIssues: data.matches.length,
          processingTime: data.software.responseTime,
        },
      },
    };

    res.json(standardizedResponse);
  } catch (error) {
    console.error("[GrammarCheck] Error:", error);

    // 专业的错误处理
    const errorResponse = {
      success: false,
      error: "PROCESSING_ERROR",
      message: "Unable to process grammar check request",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    };

    res.status(500).json(errorResponse);
  }
});
