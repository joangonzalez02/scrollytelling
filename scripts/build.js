/* Minify local JS files using Terser */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const files = [
  'main.js',
  'mapbox-integration.js',
  'population-chart.js',
  'vehicle-chart.js',
  'urban-evolution.js'
];

const srcDir = path.join(process.cwd(), 'src');
const distDir = path.join(process.cwd(), 'dist');

// Crear carpeta dist si no existe
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

(async () => {
  for (const rel of files) {
    const srcPath = path.join(srcDir, rel);
    const outPath = path.join(distDir, rel.replace(/\.js$/, '.min.js'));
    if (!fs.existsSync(srcPath)) {
      console.warn(`[build] Skip missing ${rel}`);
      continue;
    }
    const code = fs.readFileSync(srcPath, 'utf8');
    try {
      const result = await minify(code, {
        compress: {
          pure_funcs: ['console.log']
        },
        mangle: true,
        format: { comments: false }
      });
      fs.writeFileSync(outPath, result.code, 'utf8');
      console.log(`[build] Minified src/${rel} -> dist/${path.basename(outPath)} (${(result.code.length/1024).toFixed(1)} KiB)`);
    } catch (e) {
      console.error(`[build] Failed to minify ${rel}:`, e.message);
      process.exitCode = 1;
    }
  }
})();
