import React, {useState, useEffect} from "react";
import axios from "axios";
import {getToken, removeToken} from '../services/auth';
import LoadPayment from "./LoadPayment";

const url = 'http://localhost:5000'

const Protected = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProtectedData = async () => {
            try {
                const token = getToken();
                const response = await axios.get(url + '/api/users/protected', {
                    headers: {Authorization: `Bearer ${token}`}
                });
                setMessage(response.data.message);
            } catch (error) {
                setMessage('Access denied. Please log in.');
                removeToken();
            }
        };

        fetchProtectedData();
    }, []); 
    return (
        <div>
            <h2>Protected Page</h2> 
            <p>{message}</p>
            <LoadPayment />
        </div>
    );
}

export default Protected;