import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script } from 'node:vm';

const dist = resolve('dist');
const htmlPath = resolve(dist, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script type="module"[^>]* src="(\.\/assets\/[^"]+\.js)"><\/script>/g)];
const stylesheets = [...html.matchAll(/<link rel="stylesheet"[^>]* href="(\.\/assets\/[^"]+\.css)">/g)];

if (scripts.length !== 1 || stylesheets.length !== 1) {
  throw new Error('Expected exactly one built JavaScript file and one built stylesheet.');
}

const asset = path => readFileSync(resolve(dist, path), 'utf8');
const script = asset(scripts[0][1]).replace(/<\/script/gi, '<\\/script');
const style = asset(stylesheets[0][1]).replace(/<\/style/gi, '<\\/style');
new Script(script, { filename: scripts[0][1] });

const standalone = html
  .replace('<html>', '<html data-standalone-preview>')
  .replace(scripts[0][0], '')
  .replace(stylesheets[0][0], `<style>${style}</style>`)
  .replace('</body>', `<script>${script}</script>\n</body>`);

if (standalone.includes(scripts[0][1]) || standalone.includes(stylesheets[0][1])) {
  throw new Error('Standalone preview still references a built local asset.');
}

const output = resolve(dist, 'standalone-preview.html');
writeFileSync(output, standalone);
console.log(`Created ${output}`);
