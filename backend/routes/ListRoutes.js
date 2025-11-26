// routes/ListRoutes.js
const express = require("express");
const router = express.Router();

const Category = require("../models/Category");

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    // Retrieve all category documents from the database
    const cats = await Category.find();

    // Send category data as JSON
    res.json(cats);
  } catch (err) {
    // If an error occurs, send HTTP 500 with the error message
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
