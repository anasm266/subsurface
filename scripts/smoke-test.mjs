import { existsSync, readFileSync, readdirSync } from 'node:fs';

function hasAsset(prefix) {
  return readdirSync('dist/assets').some((file) => file.startsWith(prefix));
}

const requiredFiles = [
  'dist/manifest.json',
  'dist/service-worker-loader.js',
  'dist/src/popup/index.html',
  'dist/public/icons/icon16.png',
  'dist/public/icons/icon32.png',
  'dist/public/icons/icon48.png',
  'dist/public/icons/icon128.png',
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`missing build artifact: ${file}`);
  }
}

if (!hasAsset('injected.ts-')) {
  throw new Error('missing injected content script bundle');
}

if (!hasAsset('content-isolated.ts-')) {
  throw new Error('missing isolated content script bundle');
}

if (!hasAsset('service-worker.ts-')) {
  throw new Error('missing service worker bundle');
}

const manifest = JSON.parse(readFileSync('dist/manifest.json', 'utf8'));

if (manifest.manifest_version !== 3) {
  throw new Error('manifest must be v3');
}

if (!manifest.background?.service_worker) {
  throw new Error('missing background service worker');
}

if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length < 2) {
  throw new Error('expected isolated and main world content scripts');
}

const hasMainWorld = manifest.content_scripts.some((entry) => entry.world === 'MAIN');
if (!hasMainWorld) {
  throw new Error('missing MAIN world content script');
}

console.log('dist smoke check passed');
