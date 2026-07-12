import { mkdirSync, copyFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
function cp(src,dst){mkdirSync(dst,{recursive:true}); for(const f of readdirSync(src)){const s=join(src,f), d=join(dst,f); statSync(s).isDirectory()?cp(s,d):copyFileSync(s,d)}}
cp('src','dist/src');
console.log('Built static helper into dist/');
