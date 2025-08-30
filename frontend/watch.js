// This script uses esbuild to watch for file changes and rebuild automatically.
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs-extra');

const distDir = 'dist';

// First, ensure the dist directory and a placeholder index.html exist.
// This prevents errors if the proxy server starts before the first build.
async function prepare() {
    await fs.ensureDir(distDir);
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head><title>Loading...</title></head>
<body><div id="root"></div><script defer src="./bundle.js"></script></body>
</html>`;
    if (!fs.existsSync(path.join(distDir, 'index.html'))) {
        await fs.writeFile(path.join(distDir, 'index.html'), htmlTemplate);
    }
}

async function watch() {
    await prepare();
    
    // Copy the original index.html and modify it for the build
    let htmlContent = await fs.readFile('index.html', 'utf-8');
    htmlContent = htmlContent.replace(/<script type="importmap">[\s\S]*?<\/script>/, '');
    htmlContent = htmlContent.replace(
      '<script type="module" src="./index.tsx"></script>',
      '<script defer src="./bundle.js"></script>'
    );
    await fs.writeFile(path.join(distDir, 'index.html'), htmlContent);

    console.log('Initial build of index.html complete.');

    esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: path.join(distDir, 'bundle.js'),
      sourcemap: true,
      loader: { '.tsx': 'tsx' },
      define: { 
        'process.env.NODE_ENV': "'development'",
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
      },
      watch: {
        onRebuild(error, result) {
          if (error) {
            console.error('Watch build failed:', error);
          } else {
            console.log('✅ Rebuilt successfully!');
          }
        },
      },
    }).then(() => {
      console.log('Watching for file changes...');
    }).catch((err) => {
        console.error(err);
        process.exit(1)
    });
}

watch();
