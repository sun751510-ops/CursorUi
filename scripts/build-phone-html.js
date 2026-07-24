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
const app = fs.readFileSync(path.join(web, 'app.js'), 'utf8');

let html = index
  .replace(/<link rel="manifest"[^>]*>\s*/g, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '')
  .replace(/<link rel="icon"[^>]*>\s*/g, '')
  .replace(/<link rel="stylesheet" href="styles\.css"\s*\/?>/, `<style>\n${css}\n</style>`)
  .replace(
    /<script src="native\.js"><\/script>\s*<script src="app\.js"><\/script>/,
    `<script>\n${native}\n</script>\n<script>\n${app}\n</script>`
  )
  .replace(/<script src="cursor-cloud\.js"><\/script>\s*/g, '');

if (html.includes('href="styles.css"') || html.includes('src="app.js"')) {
  console.error('build-phone-html: failed to inline assets');
  process.exit(1);
}

fs.writeFileSync(path.join(web, 'phone.html'), html);
console.log('Wrote web/phone.html');
