const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// GET /api/candidates
router.get('/', authMiddleware, (req, res) => {
  const rows = db.prepare('SELECT data FROM candidates WHERE company_id = ? ORDER BY created_at DESC').all(req.user.companyId);
  res.json(rows.map(r => JSON.parse(r.data)));
});

// POST /api/candidates — upsert
router.post('/', authMiddleware, (req, res) => {
  const candidate = req.body;
  if (!candidate?.id) return res.status(400).json({ error: 'id required' });
  db.prepare(`
    INSERT INTO candidates (id, company_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      data = excluded.data,
      updated_at = excluded.updated_at
  `).run(
    candidate.id,
    req.user.companyId,
    JSON.stringify(candidate),
    candidate.createdAt || new Date().toISOString(),
    new Date().toISOString()
  );
  res.json({ success: true });
});

// POST /api/candidates/bulk — bulk insert (for CSV import)
router.post('/bulk', authMiddleware, (req, res) => {
  const candidates = req.body;
  if (!Array.isArray(candidates)) return res.status(400).json({ error: 'Array expected' });

  const upsert = db.prepare(`
    INSERT INTO candidates (id, company_id, data, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `);

  db.transaction(() => {
    for (const c of candidates) {
      upsert.run(c.id, req.user.companyId, JSON.stringify(c), c.createdAt, new Date().toISOString());
    }
  })();

  res.json({ success: true, count: candidates.length });
});

// DELETE /api/candidates/:id
router.delete('/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM candidates WHERE id = ? AND company_id = ?').run(req.params.id, req.user.companyId);
  res.json({ success: true });
});

// DELETE /api/candidates — delete all (for restore from backup)
router.delete('/', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM candidates WHERE company_id = ?').run(req.user.companyId);
  res.json({ success: true });
});

// POST /api/candidates/:id/resume — upload resume
router.post('/:id/resume', authMiddleware, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      console.error('[Resume Upload] req.file is undefined — multer did not parse the file');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      console.error('[Resume Upload] req.file.buffer is empty for file:', req.file.originalname);
      return res.status(400).json({ error: 'File content is empty' });
    }

    const cand = db.prepare('SELECT id FROM candidates WHERE id = ? AND company_id = ?')
      .get(req.params.id, req.user.companyId);
    if (!cand) {
      console.error('[Resume Upload] Candidate not found:', req.params.id);
      return res.status(404).json({ error: 'Candidate not found' });
    }

    db.prepare(`
      INSERT INTO files (id, candidate_id, type, filename, mime_type, data)
      VALUES (?, ?, 'resume', ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        filename = excluded.filename,
        mime_type = excluded.mime_type
    `).run(`${req.params.id}_resume`, req.params.id, req.file.originalname, req.file.mimetype, req.file.buffer);

    console.log(`[Resume Upload] Saved ${req.file.size} bytes for candidate ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[Resume Upload] Error:', err);
    res.status(500).json({ error: 'Failed to save resume: ' + err.message });
  }
});

// GET /api/candidates/:id/resume — download resume
router.get('/:id/resume', authMiddleware, (req, res) => {
  // Debug: check if file exists without the company JOIN
  const rawFile = db.prepare(`SELECT id, candidate_id FROM files WHERE candidate_id = ? AND type = 'resume'`).get(req.params.id);
  console.log(`[Resume Download] id=${req.params.id} company=${req.user.companyId} raw=${JSON.stringify(rawFile)}`);

  const file = db.prepare(`
    SELECT f.* FROM files f
    JOIN candidates c ON c.id = f.candidate_id
    WHERE f.candidate_id = ? AND f.type = 'resume' AND c.company_id = ?
  `).get(req.params.id, req.user.companyId);

  if (!file) return res.status(404).json({ error: 'Resume not found' });
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
  res.send(file.data);
});

// DELETE /api/candidates/:id/resume
router.delete('/:id/resume', authMiddleware, (req, res) => {
  db.prepare("DELETE FROM files WHERE candidate_id = ? AND type = 'resume'").run(req.params.id);
  res.json({ success: true });
});

// POST /api/candidates/:id/testfile/:testId — upload test result file
router.post('/:id/testfile/:testId', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const fileId = `${req.params.id}_test_${req.params.testId}`;
  db.prepare(`
    INSERT INTO files (id, candidate_id, type, filename, mime_type, data)
    VALUES (?, ?, 'test', ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, filename = excluded.filename, mime_type = excluded.mime_type
  `).run(fileId, req.params.id, req.file.originalname, req.file.mimetype, req.file.buffer);
  res.json({ success: true });
});

// GET /api/candidates/:id/testfile/:testId — download test result file
router.get('/:id/testfile/:testId', authMiddleware, (req, res) => {
  const fileId = `${req.params.id}_test_${req.params.testId}`;
  const file = db.prepare(`
    SELECT f.* FROM files f
    JOIN candidates c ON c.id = f.candidate_id
    WHERE f.id = ? AND c.company_id = ?
  `).get(fileId, req.user.companyId);

  if (!file) return res.status(404).json({ error: 'File not found' });
  res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
  res.send(file.data);
});

module.exports = router;
