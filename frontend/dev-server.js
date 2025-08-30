// This script creates a robust development server using esbuild's built-in capabilities
// and a lightweight proxy for API requests. This is the standard and most reliable
// way to handle local development for a full-stack application.
const esbuild = require('esbuild');
const http = require('http');
const path = require('path');
const { postcssPlugin } = require('./build-plugins');

const PORT = 3000;
const BACKEND_PORT = process.env.BACKEND_PORT || 4000;
const SERVED_DIR = 'dist';

// Start esbuild's server on a random port. It will serve files from memory.
esbuild.serve({
  servedir: SERVED_DIR,
  port: 0, // 0 means a random available port
}).then(result => {
  // The esbuild server is running on result.port

  // Create a separate proxy server to handle incoming requests.
  http.createServer((req, res) => {
    const { url, method, headers } = req;
    
    // --- API Proxy Logic ---
    // If the request path starts with /api, forward it to the backend server.
    if (url.startsWith('/api')) {
      const proxyReq = http.request({
        hostname: 'localhost',
        port: BACKEND_PORT,
        path: url,
        method: method,
        headers: headers,
      }, proxyRes => {
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
      return; // Stop further processing
    }

    // --- esbuild File Server Logic ---
    // For all other requests (like index.html, JS, CSS), forward them to the esbuild server.
    // This server handles serving the files and also provides the hot-reload functionality.
    const forwardReq = http.request({
      hostname: result.host,
      port: result.port,
      path: url,
      method: method,
      headers: headers,
    }, forwardRes => {
      // If esbuild doesn't find a file, it returns 404. In that case, we should
      // serve index.html for client-side routing to work.
      if (forwardRes.statusCode === 404) {
        // Serve index.html
        const indexReq = http.request({
            hostname: result.host,
            port: result.port,
            path: '/', // Request the root, which is index.html
            method: 'GET',
            headers: headers,
        }, indexRes => {
            res.writeHead(indexRes.statusCode, indexRes.headers);
            indexRes.pipe(res, { end: true });
        });
        indexReq.end();
        return;
      }

      res.writeHead(forwardRes.statusCode, forwardRes.headers);
      forwardRes.pipe(res, { end: true });
    });

    req.pipe(forwardReq, { end: true });

  }).listen(PORT, () => {
    console.log(`\n🚀 Frontend dev server running on http://localhost:${PORT}`);
    console.log(`   - API requests to /api are proxied to http://localhost:${BACKEND_PORT}`);
    console.log(`   - Static files are served from the "${SERVED_DIR}" directory (in memory).`);
    console.log('   - Watching for file changes...\n');
  });
}).catch(err => {
    console.error("Failed to start esbuild server:", err);
    process.exit(1);
});

// Also, start a separate esbuild process in watch mode to keep rebuilding the files.
// The server above will then serve the latest in-memory version.
esbuild.build({
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
    watch: {
        onRebuild(error, result) {
            if (error) console.error('Watch build failed:', error);
            else console.log('✅ Rebuilt successfully!');
        },
    },
}).catch(() => process.exit(1));