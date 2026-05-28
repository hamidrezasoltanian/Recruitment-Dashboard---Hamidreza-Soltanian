// This script uses CommonJS require, run with node.
const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const packageJson = require('./package.json');
const { execSync } = require('child_process');

// Load .env if present (local development)
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length && !process.env[key]) {
      process.env[key] = rest.join('=').trim();
    }
  });
}

const distDir = 'dist';

async function build() {
  try {
    // 1. Clean the dist directory
    await fs.emptyDir(distDir);
    console.log('Cleaned dist directory.');

    // Read env vars from environment (or .env file loaded above)
    const apiKey        = process.env.API_KEY || '';
    const supabaseUrl   = process.env.SUPABASE_URL || '';
    const supabaseKey   = process.env.SUPABASE_ANON_KEY || '';
    const appVersion    = packageJson.version;
    
    // 2. Build Tailwind CSS
    console.log('Building Tailwind CSS...');
    execSync('npx tailwindcss -i ./styles.css -o ./dist/styles.css --minify', { stdio: 'inherit' });
    console.log('Tailwind CSS built successfully.');

    // Copy vendor libraries (offline-first)
    await fs.copy(
      'node_modules/persian-date/dist/persian-date.min.js',
      path.join(distDir, 'vendor/persian-date.min.js')
    );
    // Copy Vazir font files to both dist/fonts/ (for styles.css) and dist/vendor/fonts/ (for HTML inline @font-face)
    const fontSrc = 'vendor/fonts';
    const fontFiles = ['Vazir-Variable.woff2', 'Vazir-Regular.woff2', 'Vazir-Bold.woff2', 'Vazir-Medium.woff2', 'Vazir-Light.woff2'];
    for (const dest of [path.join(distDir, 'fonts'), path.join(distDir, 'vendor/fonts')]) {
      await fs.ensureDir(dest);
      for (const f of fontFiles) {
        await fs.copy(path.join(fontSrc, f), path.join(dest, f));
      }
    }
    console.log('Vendor libraries and fonts copied.');

    // 3. Build the TypeScript/React code
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: path.join(distDir, 'bundle.js'),
      minify: true,
      sourcemap: true,
      loader: { '.tsx': 'tsx' },
      define: {
        'process.env.NODE_ENV':         "'production'",
        'process.env.API_KEY':          JSON.stringify(apiKey),
        'process.env.SUPABASE_URL':     JSON.stringify(supabaseUrl),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(supabaseKey),
        'process.env.APP_VERSION':      JSON.stringify(appVersion),
      },
    });
    console.log('JavaScript bundled successfully.');

    // 4. Read, modify, and write index.html
    let htmlContent = await fs.readFile('index.html', 'utf-8');
    
    // Remove Tailwind CDN script and add local stylesheet
    htmlContent = htmlContent.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*/, '');
    htmlContent = htmlContent.replace('</head>', '    <link rel="stylesheet" href="./styles.css">\n</head>');

    // Remove importmap
    htmlContent = htmlContent.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
    
    // Change the main script tag to point to the bundle
    htmlContent = htmlContent.replace(
      '<script type="module" src="./index.tsx"></script>',
      '<script defer src="./bundle.js"></script>'
    );
    
    await fs.writeFile(path.join(distDir, 'index.html'), htmlContent);
    console.log('index.html processed and copied to dist.');

    console.log('\nBuild complete! The "dist" folder is ready for deployment.');

  } catch (e) {
    console.error('Build failed:', e);
    process.exit(1);
  }
}

build();
