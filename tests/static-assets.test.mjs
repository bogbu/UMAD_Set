import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const files = {
  source: await readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  rootApp: await readFile(new URL('../app.js', import.meta.url), 'utf8'),
  dist: await readFile(new URL('../dist/app.js', import.meta.url), 'utf8'),
  index: await readFile(new URL('../index.html', import.meta.url), 'utf8'),
  rootStyles: await readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  distIndex: await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  build: await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8'),
};

const requiredResizeSymbols = [
  'PANEL_STORAGE_KEY',
  'panelSize',
  'panelStyle',
  'startPanelDrag',
  'movePanelDrag',
  'stopPanelDrag',
  'panel-resize-grip',
  'viewportScale',
  'overlayCanvasSize',
  'readShellScroll',
  'restoreShellScroll',
];

for (const symbol of requiredResizeSymbols) {
  assert.equal(files.source.includes(symbol), true, `source should include resize behavior: ${symbol}`);
  assert.equal(files.rootApp.includes(symbol), true, `root app should include resize behavior: ${symbol}`);
  assert.equal(files.dist.includes(symbol), true, `dist app should include resize behavior: ${symbol}`);
}

assert.equal(files.rootStyles.includes('panel-resize-grip'), true, 'root styles should style the resize grip');
assert.equal(files.distIndex.includes('scroll-fix-23'), true, 'dist index should reference scroll-fix-23 assets');

const versionedFiles = Object.entries(files).filter(([name]) => !name.toLowerCase().includes('styles'));

for (const [name, content] of versionedFiles) {
  assert.match(content, /scroll-fix-23/, `${name} should reference the current scroll-fix-23 asset version`);
  assert.equal(content.includes('resize-22'), false, `${name} should not reference stale resize-22 assets`);
  assert.equal(content.includes('resize-21'), false, `${name} should not reference stale resize-21 assets`);
  assert.equal(content.includes('resize-20'), false, `${name} should not reference stale resize-20 assets`);
  assert.equal(content.includes('resize-19'), false, `${name} should not reference stale resize-19 assets`);
  assert.equal(content.includes('resize-18'), false, `${name} should not reference stale resize-18 assets`);
  assert.equal(content.includes('resize-17'), false, `${name} should not reference stale resize-17 assets`);
  assert.equal(content.includes('resize-16'), false, `${name} should not reference stale resize-16 assets`);
}

console.log('static asset checks passed');
