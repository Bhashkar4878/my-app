const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const buildToken = (user) => {
  const payload = { id: user._id.toString(), username: user.username };
  const secret = process.env.JWT_SECRET || 'dev-secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
};

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const cleanUsername = username.trim();
    const normalizedUsername = cleanUsername.toLowerCase();
    const existing = await User.findOne({ usernameLower: normalizedUsername });

    if (existing) {
      return res.status(409).json({ message: 'Username already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username: cleanUsername, passwordHash });

    return res.status(201).json({ message: 'Account created' });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Could not create account' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const normalizedUsername = username.trim().toLowerCase();
    const user = await User.findOne({ usernameLower: normalizedUsername });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = buildToken(user);
    return res.json({ token });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Could not login' });
  }
});

module.exports = router;

