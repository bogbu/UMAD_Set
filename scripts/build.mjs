import { mkdirSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const ASSET_VERSION = 'settings-25';

const sourceFiles = [
  'src/domain/mechanics.js',
  'src/main.js',
];

function toClassicScript(source, file) {
  return source
    .replace(/^import[^\n]+\n/gm, '')
    .replace(/\bexport\s+(?=(?:const|let|var|function|class)\b)/g, '')
    .trimStart();
}

function buildAppScript() {
  return sourceFiles
    .map((file) => `// ${file}\n${toClassicScript(readFileSync(file, 'utf8'), file)}`)
    .join('\n\n');
}

const appScript = buildAppScript();
const indexHtml = `<!doctype html><html lang="ko"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>절요성 4페 컨페</title><link rel="stylesheet" href="./styles.css?v=${ASSET_VERSION}"></head><body><div id="app"><div id="boot-status" class="boot-status">요성난무 4P 도우미 로딩 중...</div></div><script>window.__UMAD_SHOW_BOOT_ERROR__=function(error){var root=document.getElementById('app');if(!root)return;var message=error&&error.message?error.message:String(error||'알 수 없는 오류');root.innerHTML='<div class="boot-error"><h1>요성난무 도우미 실행 오류</h1><p></p><small>ACT OverlayPlugin 개발자 콘솔을 확인해주세요.</small></div>';var p=root.querySelector('p');if(p)p.textContent=message;};window.addEventListener('error',function(event){window.__UMAD_SHOW_BOOT_ERROR__(event.error||event.message);});window.addEventListener('unhandledrejection',function(event){window.__UMAD_SHOW_BOOT_ERROR__(event.reason);});</script><script src="./app.js?v=${ASSET_VERSION}"></script></body></html>
`;

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
copyFileSync('src/styles.css', 'dist/styles.css');
copyFileSync('src/styles.css', 'styles.css');
writeFileSync('dist/app.js', appScript);
writeFileSync('app.js', appScript);
writeFileSync('dist/index.html', indexHtml);
writeFileSync('index.html', indexHtml);
console.log('Built OverlayPlugin-compatible static helper into dist/ and repository root');
