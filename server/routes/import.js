const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── CSV Import ──────────────────────────────────────────────────────────────

// POST /api/import/csv — parse CSV file, return headers + row preview
router.post('/csv', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  const content = req.file.buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return res.status(400).json({ error: 'CSV is empty or has no data rows' });

  // Simple CSV parser (handles quoted fields)
  const parseRow = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1, 101).map(line => { // preview max 100 rows
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });

  res.json({ headers, rows, total: lines.length - 1 });
});

// ── Resume Parser ───────────────────────────────────────────────────────────

// POST /api/import/resume-parse — extract text + structured info from PDF/DOCX
router.post('/resume-parse', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });

  let text = '';
  try {
    const mime = req.file.mimetype;
    const name = req.file.originalname.toLowerCase();

    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      const pdfParse = require('pdf-parse');
      const result = await pdfParse(req.file.buffer);
      text = result.text;
    } else if (
      mime.includes('wordprocessingml') ||
      mime.includes('msword') ||
      name.endsWith('.docx') ||
      name.endsWith('.doc')
    ) {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    } else {
      // plain text fallback
      text = req.file.buffer.toString('utf-8');
    }
  } catch (err) {
    return res.status(422).json({ error: 'خطا در پردازش فایل: ' + err.message });
  }

  // Extract structured data
  const emailMatch = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/((\+98|0098)?[ -]?9[0-9]{9}|(0[1-9][0-9]{9,10}))/);
  const phone = phoneMatch ? phoneMatch[0].replace(/[ -]/g, '') : '';

  // Name: first non-empty line that is 2-5 words and no @ or digits at start
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const nameLine = lines.find(l => {
    const words = l.split(/\s+/);
    return words.length >= 2 && words.length <= 5 &&
      !l.includes('@') && !/^[0-9]/.test(l) && l.length < 50 && l.length > 3;
  });

  res.json({
    extracted: {
      name: nameLine || '',
      email: emailMatch?.[0] || '',
      phone,
    },
    textPreview: text.substring(0, 500),
  });
});

// ── Email Import Configuration ──────────────────────────────────────────────

// GET /api/import/email-config
router.get('/email-config', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT data FROM settings WHERE company_id = ?').get(req.user.companyId);
  const settings = row ? JSON.parse(row.data) : {};
  const config = settings.emailImport || null;
  // Never return the password in plain text
  if (config?.password) config.password = '••••••••';
  res.json(config);
});

// POST /api/import/email-config — save IMAP config
router.post('/email-config', authMiddleware, (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'ادمین لازم است.' });

  const { host, port, user, password, enabled, defaultPosition, defaultSource } = req.body;
  if (!host || !user) return res.status(400).json({ error: 'Host and user are required' });

  const row = db.prepare('SELECT data FROM settings WHERE company_id = ?').get(req.user.companyId);
  const settings = row ? JSON.parse(row.data) : {};

  // Keep existing password if not changed
  const existingPass = settings.emailImport?.password || '';
  settings.emailImport = {
    host, port: parseInt(port) || 993,
    user,
    password: password === '••••••••' ? existingPass : password,
    enabled: !!enabled,
    defaultPosition: defaultPosition || '',
    defaultSource: defaultSource || 'ایمیل',
  };

  db.prepare(`
    INSERT INTO settings (company_id, data) VALUES (?, ?)
    ON CONFLICT(company_id) DO UPDATE SET data = excluded.data
  `).run(req.user.companyId, JSON.stringify(settings));

  // Trigger poller restart
  try { require('../services/emailPoller').restartPoller(req.user.companyId); } catch { /* ignore */ }

  res.json({ success: true });
});

// POST /api/import/email-config/test — test IMAP connection
router.post('/email-config/test', authMiddleware, async (req, res) => {
  const { host, port, user, password } = req.body;
  try {
    const { ImapFlow } = require('imapflow');
    const client = new ImapFlow({ host, port: parseInt(port) || 993, secure: true, auth: { user, pass: password }, logger: false });
    await client.connect();
    await client.logout();
    res.json({ success: true, message: 'اتصال موفق!' });
  } catch (err) {
    res.status(422).json({ error: 'خطا در اتصال: ' + err.message });
  }
});

module.exports = router;
