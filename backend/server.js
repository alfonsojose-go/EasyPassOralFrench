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
