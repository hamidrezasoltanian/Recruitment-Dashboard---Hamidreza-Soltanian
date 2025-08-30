// This file centralizes esbuild plugins to be shared between
// the development server (dev-server.js) and the production build script (build.js).
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs-extra');
const path = require('path');

/**
 * An esbuild plugin to run PostCSS with TailwindCSS.
 * It processes the main CSS entry point and outputs the result.
 */
const postcssPlugin = {
  name: 'postcss',
  setup(build) {
    build.onEnd(async (result) => {
      // Don't run if there are build errors
      if (result.errors.length > 0) return;

      const cssEntryPoint = path.resolve(__dirname, 'index.css');
      const outputCssPath = path.resolve(__dirname, 'dist/bundle.css');

      try {
        const cssContent = await fs.readFile(cssEntryPoint, 'utf8');
        
        const postcssResult = await postcss([
          tailwindcss,
          autoprefixer,
        ]).process(cssContent, { from: cssEntryPoint, to: outputCssPath });
        
        await fs.ensureDir(path.dirname(outputCssPath));
        await fs.writeFile(outputCssPath, postcssResult.css);

      } catch (err) {
        console.error('PostCSS processing failed:', err);
      }
    });
  },
};

module.exports = { postcssPlugin };
