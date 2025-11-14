import React, { useState } from 'react';
import axios from 'axios';

const url = 'http://localhost:5000'

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(url +'/api/users/register', { username, password });
            setMessage(response.data.message);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Registration failed');
        }   
    };

    return (
        <div>
            <h2>Register</h2>
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
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
}

export default Register;