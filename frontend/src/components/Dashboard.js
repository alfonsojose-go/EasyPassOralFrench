import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Inline editing states
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedTitle, setEditedTitle] = useState("");

  const navigate = useNavigate();

  // Hardcoded task types (can later be dynamic)
  const taskTypes = ["Task1", "Task2", "Task3"];

  // -----------------------------------------
  // Fetch Tasks + Auth Check
  // -----------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
          return;
        }

        const data = await res.json();
        setTasks(data);
        setFilteredTasks(data);

        if (!data || data.length === 0) {
          setMessage("No tasks found for this user.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Error fetching tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [navigate]);

  // -----------------------------------------
  // Filtering Logic
  // -----------------------------------------
  useEffect(() => {
    let temp = [...tasks];

    if (selectedType) {
      temp = temp.filter((t) => t.taskType?.name === selectedType);
    }

    if (selectedCategory) {
      temp = temp.filter((t) => t.category?._id === selectedCategory);
    }

    setFilteredTasks(temp);
  }, [selectedType, selectedCategory, tasks]);

  // -----------------------------------------
  // Delete Task Handler
  // -----------------------------------------
  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t._id !== id));
      } else {
        alert("Failed to delete task");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // -----------------------------------------
  // SAVE EDITED TASK TITLE
  // -----------------------------------------
  const handleEditSave = async (id) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editedTitle }),
      });

      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t._id === id ? { ...t, title: editedTitle } : t))
        );
        setEditingTaskId(null);
      } else {
        alert("Failed to update title");
      }
    } catch (err) {
      console.error("Edit error:", err);
    }
  };

  // -----------------------------------------
  // Category dropdown options
  // -----------------------------------------
  const categoriesForType = selectedType
    ? tasks
        .filter((t) => t.taskType?.name === selectedType)
        .map((t) => t.category)
        .filter((v, i, a) => v && a.findIndex((c) => c._id === v._id) === i)
    : [];

  const openTask = (id) => {
    navigate(`/task/${id}`);
  };

  // -----------------------------------------
  // Loading state
  // -----------------------------------------
  if (loading) {
    return <p>Loading tasks...</p>;
  }

  return (
    <div>
      <h1>My Tasks</h1>

      {/* Add Task Button */}
      <button
        onClick={() => navigate("/add-task")}
        style={{
          marginBottom: "20px",
          padding: "8px 12px",
          cursor: "pointer",
        }}
      >
        ➕ Add Task
      </button>

      {/* Filters */}
      <div style={{ marginBottom: "20px" }}>
        <label>Task Type: </label>
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setSelectedCategory("");
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

      {/* Render Task List */}
      {filteredTasks.map((task) => (
        <div
          key={task._id}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          {/* If editing this task */}
          {editingTaskId === task._id ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
              />

              <button
                onClick={() => handleEditSave(task._id)}
                style={{ marginLeft: "10px" }}
              >
                Save
              </button>

              <button
                onClick={() => setEditingTaskId(null)}
                style={{ marginLeft: "10px", color: "gray" }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {/* Normal Mode */}
              <b>{task.title}</b> — {task.taskType?.name || "No type"} /{" "}
              {task.category?.name || "No category"}

              <button
                onClick={() => openTask(task._id)}
                style={{ marginLeft: "10px" }}
              >
                Start
              </button>

              {/* Inline Edit Button */}
              <button
                onClick={() => {
                  setEditingTaskId(task._id);
                  setEditedTitle(task.title);
                }}
                style={{ marginLeft: "10px" }}
              >
                Edit
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(task._id)}
                style={{ marginLeft: "10px", color: "red" }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
