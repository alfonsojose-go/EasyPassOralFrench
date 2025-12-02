import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AddTask = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("");
  const [category, setCategory] = useState("");
  const [taskTypes, setTaskTypes] = useState([]);
  const [message, setMessage] = useState("");

  // Load TaskTypes from DB
  useEffect(() => {
    const loadTypes = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/tasks/types/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setTaskTypes(data);
    };

    loadTypes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!title || !taskType || !category) {
      setMessage("All fields are required.");
      return;
    }

    try {
      // 1️⃣ Create or reuse category
      const catRes = await fetch("http://localhost:5000/api/tasks/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: category,
          taskType: taskType, // ObjectId!
        }),
      });

      const createdCategory = await catRes.json();

      if (!createdCategory._id) {
        setMessage("Failed to create category.");
        return;
      }

      // 2️⃣ Create task
      const taskRes = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          taskType,
          category: createdCategory._id,
        }),
      });

      if (taskRes.ok) {
        navigate("/dashboard");
      } else {
        setMessage("Failed to create task.");
      }
    } catch (err) {
      console.error(err);
      setMessage("Error creating task.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Add New Task</h1>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <form onSubmit={handleSubmit}>
        {/* Task Title */}
        <div style={{ marginBottom: "12px" }}>
          <label>Task Title</label>
          <br />
          <input
            type="text"
            placeholder="Enter task name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          />
        </div>

        {/* Task Type Dropdown */}
        <div style={{ marginBottom: "12px" }}>
          <label>Task Type</label>
          <br />
          <select
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          >
            <option value="">Select Task Type</option>
            {taskTypes.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category Input */}
        <div style={{ marginBottom: "12px" }}>
          <label>Category</label>
          <br />
          <input
            type="text"
            placeholder="Enter category name"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: "6px", width: "300px" }}
          />
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
