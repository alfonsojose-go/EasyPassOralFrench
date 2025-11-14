import React, { useState } from 'react';
import axios from 'axios';
import {setToken} from '../services/auth';

const url = 'http://localhost:5000'

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(url +'/api/users/login', { username, password });
            setToken(response.data.token);
            setMessage('Login successful!');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Login failed');
        }   
    };
    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div>   
                    <label>Password:</label>
                    <input
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />  
                </div>
                <button type="submit">Login</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Login;