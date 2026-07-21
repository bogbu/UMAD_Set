import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const files = {
  source: await readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  rootApp: await readFile(new URL('../app.js', import.meta.url), 'utf8'),
  dist: await readFile(new URL('../dist/app.js', import.meta.url), 'utf8'),
  index: await readFile(new URL('../index.html', import.meta.url), 'utf8'),
  rootStyles: await readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  distIndex: await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  distStyles: await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8'),
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
assert.equal(files.source.includes('class="preset-option'), true, 'source should render preset options as stable buttons');
assert.equal(files.source.includes('<select data-setting-preset>'), false, 'source should not use a native preset select');
assert.equal(files.rootApp.includes('class="preset-option'), true, 'root app should render preset options as stable buttons');
assert.equal(files.dist.includes('class="preset-option'), true, 'dist app should render preset options as stable buttons');
assert.equal(files.rootStyles.includes('preset-option'), true, 'root styles should style preset option buttons');
assert.equal(files.distIndex.includes('settings-29'), true, 'dist index should reference settings-29 assets');


const requiredActionStyleSymbols = [
  'actionTone',
  'result-danger',
  'result-safe',
  'summary-action-danger',
  'summary-action-safe',
];

for (const symbol of requiredActionStyleSymbols) {
  assert.equal(files.source.includes(symbol) || files.rootStyles.includes(symbol), true, `source assets should include action color styling: ${symbol}`);
  assert.equal(files.rootApp.includes(symbol) || files.rootStyles.includes(symbol), true, `root assets should include action color styling: ${symbol}`);
  assert.equal(files.dist.includes(symbol) || files.distStyles.includes(symbol), true, `dist assets should include action color styling: ${symbol}`);
}

const versionedFiles = Object.entries(files).filter(([name]) => !name.toLowerCase().includes('styles'));

for (const [name, content] of versionedFiles) {
  assert.match(content, /settings-29/, `${name} should reference the current settings-29 asset version`);
  assert.equal(content.includes('settings-28'), false, `${name} should not reference stale settings-28 assets`);
  assert.equal(content.includes('resize-22'), false, `${name} should not reference stale resize-22 assets`);
  assert.equal(content.includes('resize-21'), false, `${name} should not reference stale resize-21 assets`);
  assert.equal(content.includes('resize-20'), false, `${name} should not reference stale resize-20 assets`);
  assert.equal(content.includes('resize-19'), false, `${name} should not reference stale resize-19 assets`);
  assert.equal(content.includes('resize-18'), false, `${name} should not reference stale resize-18 assets`);
  assert.equal(content.includes('resize-17'), false, `${name} should not reference stale resize-17 assets`);
  assert.equal(content.includes('resize-16'), false, `${name} should not reference stale resize-16 assets`);
}

console.log('static asset checks passed');
