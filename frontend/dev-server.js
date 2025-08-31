// This script creates a robust development server using esbuild's built-in capabilities
// and a lightweight proxy for API requests. This is the standard and most reliable
// way to handle local development for a full-stack application.
const esbuild = require('esbuild');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const { postcssPlugin } = require('./build-plugins');

const PORT = 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const SERVED_DIR = 'dist';

async function startDevServer() {
  // --- Pre-build Step ---
  // Ensure the dist directory exists and has a valid index.html
  await fs.ensureDir(SERVED_DIR);
  await fs.copyFile('index.html', path.join(SERVED_DIR, 'index.html'));
  console.log('Prepared dist/index.html for development server.');

  // Start esbuild's server on a random port. It will serve files from memory.
  const esbuildServer = await esbuild.serve({
    servedir: SERVED_DIR,
    port: 0, // 0 means a random available port
  }, {
    // esbuild serve options are build options
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

  // Create a separate proxy server to handle incoming requests.
  http.createServer((req, res) => {
    const { url, method, headers } = req;
    
    const forwardRequest = (targetPath) => {
      const options = {
        hostname: esbuildServer.host,
        port: esbuildServer.port,
        path: targetPath,
        method: method,
        headers: headers,
      };

      const proxyReq = http.request(options, (proxyRes) => {
        // If esbuild can't find the file, it will return a 404. In that case,
        // we should serve index.html for client-side routing.
        if (proxyRes.statusCode === 404) {
          // Serve index.html
          return forwardRequest('/');
        }
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      
      req.pipe(proxyReq, { end: true });
    };

    // --- API Proxy Logic ---
    if (url.startsWith('/api')) {
      const proxyReq = http.request({
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: url,
        method: method,
        headers: headers,
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });

      proxyReq.on('error', (err) => {
        console.error(`[API Proxy Error] Could not connect to backend on port ${BACKEND_PORT}. Is it running?`);
        console.error(err);
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway: Could not connect to the backend API.');
      });

      req.pipe(proxyReq, { end: true });
    } else {
      // --- esbuild File Server Logic ---
      forwardRequest(url);
    }
  }).listen(PORT, () => {
    console.log(`\n🚀 Frontend dev server running on http://localhost:${PORT}`);
    console.log(`   - API requests to /api are proxied to http://localhost:${BACKEND_PORT}`);
    console.log(`   - Static files are served from the "${SERVED_DIR}" directory.`);
  });

  // Watch for changes in the main index.html and copy it over on change.
  fs.watchFile('index.html', { interval: 1000 }, async () => {
      try {
          await fs.copyFile('index.html', path.join(SERVED_DIR, 'index.html'));
          console.log('Updated dist/index.html due to source change.');
      } catch (err) {
          console.error('Failed to copy index.html on change:', err);
      }
  });

}

startDevServer().catch(err => {
    console.error("Failed to start development server:", err);
    process.exit(1);
});