import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link, // 🔹 add Link import
} from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Protected from "./components/Protected";
import Dashboard from "./components/Dashboard";
import TaskDetails from "./components/TaskDetails";
import "./App.css";
import AddTask from "./components/AddTask";
import Payment from "./components/Payment";

function App() {
  return (
    <Router>
      <div className="App">
        {/* navi bar */}
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">Easy Pass Oral French</h1>

            {/* Navigation Links */}
            <div className="nav-links">
              <Link to="/protected" className="nav-link">
                👤 Profile
              </Link>
              <Link to="/dashboard" className="nav-link">
                🏠 Task Center
              </Link>
              <Link to="/login" className="nav-link">
                🔐 Login
              </Link>
              <Link to="/register" className="nav-link">
                📝 Register
              </Link>
            </div>
          </div>
        </nav>

        {/* main content area*/}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/protected" element={<Protected />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/task/:id" element={<TaskDetails />} />

            {/* 🔹 Add Task page: form to add a new task */}
            <Route path="/add-task" element={<AddTask />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </main>

        {/* concise footer */}
        <footer className="footer">
          <div className="footer-content">
            <p className="footer-text">
              © 2024 Easy Pass Oral French - TCF CANADA
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
