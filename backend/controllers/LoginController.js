const User = require('../models/Login');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register a new user
exports.registerUser = async (req, res) => {
  const { username, password } = req.body;
  const userExists = await User.findOne({ username });
  
  if (userExists) return res.status(400).json({ message: 'User already exists' });
  
  const user = await User.create({ username, password });
  res.status(201).json({ message: 'User registered successfully' });

};

// Login user
exports.loginUser = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).json({ message: 'Invalid credentials' });
    }

//Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
};
