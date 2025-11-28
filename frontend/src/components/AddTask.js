import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddTask = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  // Hardcoded task types (same as Dashboard)
  const taskTypes = ["Task1", "Task2", "Task3"];

  // Fetch categories from backend (optional)
  // If you already have them in your DB, this loads them
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error("Fetch categories error:", err);
      }
    };

    fetchCategories();
  }, []);

  // Submit new task
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!title.trim()) {
      setMessage("Task title is required.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          taskType,
          category,
        }),
      });

      if (res.ok) {
        navigate("/dashboard");
      } else {
        setMessage("Failed to add task.");
      }
    } catch (err) {
      console.error("Add task error:", err);
      setMessage("Error adding task.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add New Task</h1>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* Task Title */}
        <div style={{ marginBottom: "12px" }}>
          <label>Task Title:</label>
          <br />
          <input
            type="text"
            placeholder="Enter task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          />
        </div>

        {/* Task Type */}
        <div style={{ marginBottom: "12px" }}>
          <label>Task Type:</label>
          <br />
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          >
            <option value="">Select Type</option>
            {taskTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div style={{ marginBottom: "12px" }}>
          <label>Category:</label>
          <br />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          >
            <option value="">Select Category</option>

            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" style={{ padding: "10px 16px" }}>
          Save Task
        </button>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          style={{ padding: "10px 16px", marginLeft: "10px" }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default AddTask;
