import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Protected from "./components/Protected";
import Dashboard from "./components/Dashboard"; // 🔹 Newly added: homepage task list
import TaskDetails from "./components/TaskDetails"; // 🔹 Newly added: task details page
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        {/* Navigation bar at the top */}
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Easy Pass Oral French</h1>
          </div>
        </nav>

        {/* Main content area */}
        <main className="main-content">
          <Routes>
            {/* 🔹 Redirect root path "/" to login page */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 🔹 Registration page */}
            <Route path="/register" element={<Register />} />

            {/* 🔹 Login page */}
            <Route path="/login" element={<Login />} />

            {/* 🔹 Protected page (requires login) */}
            <Route path="/protected" element={<Protected />} />

            {/* 🔹 Dashboard / Homepage: shows list of tasks */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 🔹 Task details page: shows full info for a specific task */}
            <Route path="/task/:id" element={<TaskDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
