// This script uses CommonJS require, run with node.
const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const { postcssPlugin } = require('./build-plugins');

const distDir = 'dist';

async function build() {
  try {
    // 1. Clean the dist directory
    await fs.emptyDir(distDir);
    console.log('Cleaned dist directory.');

    // Read API_KEY from the build environment
    const apiKey = process.env.API_KEY || '';

    // 2. Build the TypeScript/React code and CSS
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: path.join(distDir, 'bundle.js'),
      minify: true,
      sourcemap: false, // No sourcemap for production
      loader: { '.tsx': 'tsx' },
      plugins: [postcssPlugin], // Use the PostCSS plugin
      define: { 
        'process.env.NODE_ENV': "'production'",
        'process.env.API_KEY': JSON.stringify(apiKey),
      },
    });
    console.log('JavaScript and CSS bundled successfully.');

    // 3. Copy the final index.html to dist
    await fs.copyFile('index.html', path.join(distDir, 'index.html'));
    console.log('index.html copied to dist.');

    console.log('\nBuild complete! The "dist" folder is ready for deployment.');

  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
}

build();