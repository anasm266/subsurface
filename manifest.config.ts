import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  manifest_version: 3,
  name: 'SubSurface',
  version: '1.0.0',
  description:
    'Passively intercepts subtitle files loaded by your browser and surfaces them for download or copy.',
  permissions: ['storage', 'scripting', 'webRequest', 'downloads', 'webNavigation', 'tabs'],
  host_permissions: ['<all_urls>'],
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/content-isolated.ts'],
      run_at: 'document_start',
      all_frames: true,
    },
    {
      matches: ['<all_urls>'],
      js: ['src/content/injected.ts'],
      run_at: 'document_start',
      all_frames: true,
      world: 'MAIN',
    },
  ],
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'SubSurface',
    default_icon: {
      '16': 'icons/icon16.png',
      '32': 'icons/icon32.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png',
    },
  },
  icons: {
    '16': 'icons/icon16.png',
    '32': 'icons/icon32.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png',
  },
  web_accessible_resources: [
    {
      resources: ['icons/*'],
      matches: ['<all_urls>'],
    },
  ],
});
