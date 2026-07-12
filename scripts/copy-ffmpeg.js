/**
 * copy-ffmpeg.js
 * Copies the @ffmpeg/ffmpeg UMD wrapper + @ffmpeg/core WASM files
 * into public/ffmpeg/ so they are bundled with the extension.
 * This runs as part of the prebuild script.
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const src = {
  ffmpegJs:     resolve(root, 'node_modules/@ffmpeg/ffmpeg/dist/umd/ffmpeg.js'),
  ffmpegWorker: resolve(root, 'node_modules/@ffmpeg/ffmpeg/dist/umd/814.ffmpeg.js'),
  coreJs:       resolve(root, 'node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.js'),
  coreWasm:     resolve(root, 'node_modules/@ffmpeg/core/dist/umd/ffmpeg-core.wasm'),
};

const dest = resolve(root, 'public/ffmpeg');
if (!existsSync(dest)) mkdirSync(dest, { recursive: true });

let copied = 0;
for (const [key, srcPath] of Object.entries(src)) {
  const filename = srcPath.split(/[\\/]/).pop();
  const destPath = resolve(dest, filename);
  copyFileSync(srcPath, destPath);
  const kb = Math.round(statSync(srcPath).size / 1024);
  console.log(`  Copied ${filename} (${kb} KB)`);
  copied++;
}
console.log(`\nFFmpeg assets (${copied} files) → public/ffmpeg/`);
