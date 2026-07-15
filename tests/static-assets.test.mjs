import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const files = {
  source: await readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  dist: await readFile(new URL('../dist/app.js', import.meta.url), 'utf8'),
  index: await readFile(new URL('../index.html', import.meta.url), 'utf8'),
  distIndex: await readFile(new URL('../dist/index.html', import.meta.url), 'utf8'),
  build: await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8'),
};

const removedResizeSymbols = [
  'resizeState',
  'startResize',
  'dragResize',
  'stopResize',
  'resize-handle',
  'SIZE_STORAGE_KEY',
  'panelSize',
  'panelStyle',
  'resizePanelTo',
  'loadPanelSize',
  'savePanelSize',
  'normalizePanelSize',
  'readStoredPanelSize',
  '--panel-width',
  '--panel-height',
];

for (const [name, content] of Object.entries(files)) {
  for (const symbol of removedResizeSymbols) {
    assert.equal(content.includes(symbol), false, `${name} still references removed resize symbol: ${symbol}`);
  }
}

for (const [name, content] of Object.entries(files)) {
  assert.match(content, /resize-18/, `${name} should reference the current resize-18 asset version`);
  assert.equal(content.includes('resize-17'), false, `${name} should not reference stale resize-17 assets`);
  assert.equal(content.includes('resize-16'), false, `${name} should not reference stale resize-16 assets`);
}

console.log('static asset checks passed');
