#!/usr/bin/env node
/**
 * Builds a single-file phone demo (web/phone.html) from modular web sources.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const web = path.join(root, 'web');

const index = fs.readFileSync(path.join(web, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(web, 'styles.css'), 'utf8');
const native = fs.readFileSync(path.join(web, 'native.js'), 'utf8');
const cloud = fs.readFileSync(path.join(web, 'cursor-cloud.js'), 'utf8');
const app = fs.readFileSync(path.join(web, 'app.js'), 'utf8');
const ui = fs.readFileSync(path.join(web, 'ui.js'), 'utf8');

let defaults = {};
const secretsPath = path.join(root, 'secrets.local.json');
if (fs.existsSync(secretsPath)) {
  try {
    defaults = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
  } catch (err) {
    console.warn('Could not read secrets.local.json:', err.message);
  }
}
const defaultsScript = `window.CWAY_DEFAULTS = ${JSON.stringify(defaults)};`;

let html = index
  .replace(/<link rel="manifest"[^>]*>\s*/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '')
  .replace(/<link rel="icon"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="styles\.css"\s*\/?>/, `<style>\n${css}\n</style>`)
  .replace(
    /<script src="native\.js"><\/script>\s*<script src="cursor-cloud\.js"><\/script>\s*<script src="app\.js"><\/script>\s*<script src="ui\.js"><\/script>/,
    `<script>\n${defaultsScript}\n</script>\n<script>\n${native}\n</script>\n<script>\n${cloud}\n</script>\n<script>\n${app}\n</script>\n<script>\n${ui}\n</script>`
  );

if (html.includes('href="styles.css"') || html.includes('src="app.js"') || html.includes('src="ui.js"')) {
  console.error('build-phone-html: failed to inline assets');
  process.exit(1);
}

fs.writeFileSync(path.join(web, 'phone.html'), html);
console.log('Wrote web/phone.html');

// Cloudflare Worker static site (correct text/html Content-Type)
const publicDir = path.join(root, 'cloudflare', 'public');
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, 'index.html'), html);
console.log('Wrote cloudflare/public/index.html');
