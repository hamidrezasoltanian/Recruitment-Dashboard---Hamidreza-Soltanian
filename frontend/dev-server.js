// This script runs the frontend development server.
const express = require('express');
const path = require('path');
const esbuild = require('esbuild');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { postcssPlugin } = require('./build-plugins');
const fs = require('fs-extra');

const PORT = 3001; // The port the user was trying to use.
const SERVED_DIR = 'dist';
const BACKEND_PORT = 4000;

async function startDevServer() {
  // 1. Ensure the 'dist' directory and index.html exist before starting.
  await fs.ensureDir(SERVED_DIR);
  await fs.copyFile('index.html', path.join(SERVED_DIR, 'index.html'));

  // 2. Start the esbuild watcher to rebuild on file changes.
  try {
    const ctx = await esbuild.context({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: path.join(SERVED_DIR, 'bundle.js'),
      sourcemap: true,
      loader: { '.tsx': 'tsx' },
      plugins: [postcssPlugin],
      define: {
        'process.env.NODE_ENV': "'development'",
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
      },
    });
    await ctx.watch();
    console.log('esbuild is watching for changes...');
  } catch (err) {
    console.error("esbuild watch failed to start:", err);
    process.exit(1);
  }

  // 3. Setup and start the Express server.
  const app = express();

  // Middleware to proxy API requests to the backend server.
  app.use('/api', createProxyMiddleware({
      target: `http://localhost:${BACKEND_PORT}`,
      changeOrigin: true,
  }));

  // Serve static files from the 'dist' directory.
  app.use(express.static(SERVED_DIR));

  // For any other request, fall back to index.html for client-side routing.
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(SERVED_DIR, 'index.html'));
  });

  // Start the server.
  app.listen(PORT, () => {
    console.log(`\nFrontend dev server running at: http://localhost:${PORT}`);
    console.log(`API requests are proxied to: http://localhost:${BACKEND_PORT}`);
  });
}

startDevServer();
