const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const makeToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register — create a new company + admin user
router.post('/register', (req, res) => {
  const { companyName, userName, email, password } = req.body;
  if (!companyName || !userName || !email || !password)
    return res.status(400).json({ error: 'همه فیلدها الزامی هستند.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'این ایمیل قبلاً ثبت شده است.' });

  const companyId = uuidv4();
  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.transaction(() => {
    db.prepare('INSERT INTO companies (id, name) VALUES (?, ?)').run(companyId, companyName);
    db.prepare('INSERT INTO users (id, company_id, email, name, password_hash, is_admin) VALUES (?, ?, ?, ?, ?, 1)')
      .run(userId, companyId, email.toLowerCase(), userName, passwordHash);
    db.prepare('INSERT INTO settings (company_id, data) VALUES (?, ?)').run(companyId, '{}');
  })();

  const token = makeToken({ userId, companyId, email: email.toLowerCase(), name: userName, isAdmin: true });
  res.json({ token, user: { id: userId, email: email.toLowerCase(), name: userName, isAdmin: true, companyId } });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'ایمیل و رمز عبور الزامی هستند.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });

  const token = makeToken({
    userId: user.id,
    companyId: user.company_id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin === 1,
  });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin === 1, companyId: user.company_id },
  });
});

// GET /api/auth/me — validate token and return user
router.get('/me', authMiddleware, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u.userId, email: u.email, name: u.name, isAdmin: u.isAdmin, companyId: u.companyId } });
});

// GET /api/auth/users — list team members (admin only)
router.get('/users', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT id, email, name, is_admin FROM users WHERE company_id = ?').all(req.user.companyId);
  res.json(rows.map(r => ({ id: r.id, email: r.email, name: r.name, isAdmin: r.is_admin === 1 })));
});

// POST /api/auth/users — add team member (admin only)
router.post('/users', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'دسترسی مجاز نیست.' });
  const { email, name, password, isAdmin } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: 'ایمیل، نام و رمز عبور الزامی هستند.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ error: 'این ایمیل قبلاً ثبت شده است.' });

  const userId = uuidv4();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, company_id, email, name, password_hash, is_admin) VALUES (?, ?, ?, ?, ?, ?)')
    .run(userId, req.user.companyId, email.toLowerCase(), name, passwordHash, isAdmin ? 1 : 0);

  res.json({ success: true, id: userId });
});

// DELETE /api/auth/users/:id — remove team member (admin only)
router.delete('/users/:id', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'دسترسی مجاز نیست.' });
  if (req.params.id === req.user.userId) return res.status(400).json({ error: 'نمی‌توان حساب خود را حذف کرد.' });
  db.prepare('DELETE FROM users WHERE id = ? AND company_id = ?').run(req.params.id, req.user.companyId);
  res.json({ success: true });
});

module.exports = router;
