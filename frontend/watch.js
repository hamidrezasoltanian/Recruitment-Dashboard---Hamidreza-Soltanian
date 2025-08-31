// This script uses esbuild's watch mode to automatically rebuild the frontend
// whenever a file changes. The output is placed in the `dist` directory,
// which is then served by the main backend server.
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs-extra');
const { postcssPlugin } = require('./build-plugins');

const SERVED_DIR = 'dist';

async function watch() {
  try {
    // Ensure dist directory and index.html are ready before starting
    await fs.ensureDir(SERVED_DIR);
    await fs.copyFile('index.html', path.join(SERVED_DIR, 'index.html'));

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

    console.log('Frontend builder is watching for changes...');

    // Also watch index.html for changes and copy it over.
    fs.watchFile('index.html', { interval: 1000 }, async () => {
      try {
        await fs.copyFile('index.html', path.join(SERVED_DIR, 'index.html'));
        console.log('Updated dist/index.html.');
      } catch (err) {
        console.error('Failed to copy index.html on change:', err);
      }
    });
  } catch (err) {
    console.error("Watch mode failed to start:", err);
    process.exit(1);
  }
}

watch();
