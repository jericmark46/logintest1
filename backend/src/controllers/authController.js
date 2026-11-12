const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function authPayload(user) {
  return { token: signToken(user._id), user: user.toJSON() };
}

async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName || !EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ message: 'Please provide a valid name and email' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  try {
    const user = await User.create({ name: cleanName, email: cleanEmail, password });
    return res.status(201).json(authPayload(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }
    throw err;
  }
}

async function login(req, res) {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  return res.json(authPayload(user));
}

async function me(req, res) {
  return res.json({ user: req.user.toJSON() });
}

module.exports = { register, login, me };
