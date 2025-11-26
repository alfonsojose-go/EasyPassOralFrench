import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Predefined TaskType list to filter tasks by type
  const taskTypes = ["Task1", "Task2", "Task3"];

  // Fetch all tasks when component loads
  // Protects route: if no token, redirect to login page
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔹 Token:", token);

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        // Call backend API to fetch tasks
        const res = await fetch("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // If token expired or invalid, force user logout
        if (res.status === 401) {
          navigate("/login");
          return;
        }

        const data = await res.json();
        setTasks(data);
        setFilteredTasks(data);

        // Handle empty task list
        if (!data || data.length === 0) {
          setMessage("No tasks found for this user.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Error fetching tasks");
      }
    };

    fetchTasks();
  }, [navigate]);

  // Automatically update list when filter changes
  useEffect(() => {
    let temp = [...tasks];

    // Filter by task type
    if (selectedType) {
      temp = temp.filter((t) => t.taskType?.name === selectedType);
    }

    // Filter by task category
    if (selectedCategory) {
      temp = temp.filter((t) => t.category?._id === selectedCategory);
    }

    // Update filtered list after every filter change
    setFilteredTasks(temp);
  }, [selectedType, selectedCategory, tasks]);

  // Calculates unique categories based on selected task type
  // Used to dynamically update category dropdown
  const categoriesForType = selectedType
    ? tasks
        .filter((t) => t.taskType?.name === selectedType)
        .map((t) => t.category)
        // Avoid duplicates based on category ID
        .filter((v, i, a) => v && a.findIndex((c) => c._id === v._id) === i)
    : [];

  // Navigate to the task detail page
  const openTask = (id) => {
    navigate(`/task/${id}`);
  };

  return (
    <div>
      <h1>My Tasks</h1>

      {/* Dropdown filters for TaskType and Category */}
      <div style={{ marginBottom: "20px" }}>
        <label>Task Type: </label>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setSelectedCategory(""); // Reset category when type changes
          }}
        >
          <option value="">All Types</option>
          {taskTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: "20px" }}>Category: </label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categoriesForType.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {message && <p>{message}</p>}

      {/* Render filtered task list */}
      {filteredTasks.map((task) => (
        <div
          key={task._id}
          style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}
        >
          <b>{task.title}</b> - {task.taskType?.name || "No type"} /{" "}
          {task.category?.name || "No category"}
          {/* Click to open task detail page */}
          <button
            onClick={() => openTask(task._id)}
            style={{ marginLeft: "10px" }}
          >
            Start Task
          </button>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
