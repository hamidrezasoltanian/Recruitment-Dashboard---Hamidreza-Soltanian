const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/settings
router.get('/', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT data FROM settings WHERE company_id = ?').get(req.user.companyId);
  res.json(row ? JSON.parse(row.data) : {});
});

// PATCH /api/settings — merge partial update
router.patch('/', authMiddleware, (req, res) => {
  const current = db.prepare('SELECT data FROM settings WHERE company_id = ?').get(req.user.companyId);
  const merged = { ...(current ? JSON.parse(current.data) : {}), ...req.body };
  db.prepare(`
    INSERT INTO settings (company_id, data) VALUES (?, ?)
    ON CONFLICT(company_id) DO UPDATE SET data = excluded.data
  `).run(req.user.companyId, JSON.stringify(merged));
  res.json({ success: true });
});

module.exports = router;
