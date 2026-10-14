const r = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const M = require('../models');

const out = u => ({
  token: jwt.sign({ id: u._id, role: u.role, member: u.member }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  user: { id: u._id, name: u.name, email: u.email, role: u.role, member: u.member }
});

// Member self-registration: creates a Member profile + login
r.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
    if (await M.User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
    const member = await M.Member.create({ name, email, phone });
    const user = await M.User.create({ name, email, password: await bcrypt.hash(password, 10), role: 'member', member: member._id });
    res.status(201).json(out(user));
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.post('/login', async (req, res) => {
  const user = await M.User.findOne({ email: (req.body.email || '').toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || '', user.password)))
    return res.status(400).json({ message: 'Invalid email or password' });
  res.json(out(user));
});

module.exports = r;
