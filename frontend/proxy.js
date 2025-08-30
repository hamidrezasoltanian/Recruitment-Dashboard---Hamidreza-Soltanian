// This file creates a development server that serves static files and proxies API requests.
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;
const BACKEND_PORT = 4000;
const distPath = path.join(__dirname, 'dist');

// Proxy API requests to the backend server
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${BACKEND_PORT}`,
  changeOrigin: true,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error: Could not connect to the backend server. Is it running?');
  }
}));

// Serve static files from the 'dist' directory
app.use(express.static(distPath));

// For any other request, serve the index.html file.
// This is crucial for single-page applications that use client-side routing.
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Frontend dev server with API proxy is running on http://localhost:${PORT}`);
  console.log(`   - Serving static files from: ${distPath}`);
  console.log(`   - Proxying API requests from /api to http://localhost:${BACKEND_PORT}\n`);
});
