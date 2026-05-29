const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT) || 3001;

// Allowed origins for CORS in development
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    `http://localhost:${PORT}`,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── API routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/candidates', require('./routes/candidates'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/import', require('./routes/import'));

// Health check — used by frontend to detect server mode
app.get('/api/health', (_req, res) => res.json({ ok: true, mode: 'local-sqlite', version: '1.0' }));

// ── Static frontend ─────────────────────────────────────────────────────────
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Recruitment Dashboard Server`);
  console.log(`   http://localhost:${PORT}\n`);

  // Start email poller background service
  try {
    require('./services/emailPoller').startPoller();
  } catch (err) {
    console.warn('[EmailPoller] Could not start:', err.message);
  }
});
