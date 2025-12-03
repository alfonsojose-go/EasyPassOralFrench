import React, { useState } from "react";
import axios from "axios";
import { setToken } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";

const url = "http://localhost:5000";

const Login = ({ onLogin }) => {  // ✅ Add onLogin as a prop
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // ✅ Add loading state
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    try {
      const response = await axios.post(url + "/api/users/login", {
        username,
        password,
      });
      
      // Store token and user data
      setToken(response.data.token);
      
      // ✅ Also store user info in localStorage for persistence
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      
      setMessage("Login successful!");
      
      // ✅ Call onLogin prop to update App's authentication state
      if (onLogin) {
        onLogin();
      }
      
      // ✅ Redirect to Dashboard after successful login
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000); // Small delay to show success message
      
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      {message && (
        <p className={`message ${message.includes("successful") ? "success" : "error"}`}>
          {message}
        </p>
      )}

      <div className="form-footer">
        <p>Don't have an account? </p>
        <Link to="/register" className="btn btn-secondary">
          Create Account
        </Link>
      </div>
    </div>
  );
};

export default Login;