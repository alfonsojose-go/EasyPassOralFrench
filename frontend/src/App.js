import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
  useNavigate,
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="App">
      {/* navi bar */}
      <nav className="navbar">
        <div className="nav-container">
          <h1 className="nav-logo">Easy Pass Oral French</h1>

          {/* Navigation Links */}
          <div className="nav-links">
            {/* Profile link - only clickable when logged in */}
            {isLoggedIn ? (
              <Link to="/protected" className="nav-link">
                👤 Profile
              </Link>
            ) : (
              <span className="nav-link disabled" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                👤 Profile
              </span>
            )}

            {/* Task Center link - only clickable when logged in */}
            {isLoggedIn ? (
              <Link to="/dashboard" className="nav-link">
                🏠 Task Center
              </Link>
            ) : (
              <span className="nav-link disabled" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                🏠 Task Center
              </span>
            )}

            {/* Login/Logout button */}
            {isLoggedIn ? (
              <span 
                onClick={handleLogout} 
                className="nav-link"
                style={{cursor: "pointer"}}
              >
                🚪 Logout
              </span>
            ) : (
              <Link to="/login" className="nav-link">
                🔐 Login
              </Link>
            )}

            {/* Register link - disabled when logged in */}
            {isLoggedIn ? (
              <span className="nav-link disabled" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                📝 Register
              </span>
            ) : (
              <Link to="/register" className="nav-link">
                📝 Register
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* main content area*/}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route 
            path="/protected" 
            element={isLoggedIn ? <Protected /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/dashboard" 
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/task/:id" 
            element={isLoggedIn ? <TaskDetails /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/add-task" 
            element={isLoggedIn ? <AddTask /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/payment" 
            element={isLoggedIn ? <Payment /> : <Navigate to="/login" replace />} 
          />
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
  );
}

// Wrapper component to provide Router context
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;