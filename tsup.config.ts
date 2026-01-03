import { defineConfig } from 'tsup';
import { cp } from 'fs/promises';

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  shims: true,
  target: 'node18',
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
  async onSuccess() {
    // Copy static files to dist
    await cp('src/server/public', 'dist/server/public', { recursive: true });
    console.log('✓ Static files copied to dist/server/public');

    // Copy Ace Editor files from node_modules
    await cp(
      'node_modules/ace-builds/src-min-noconflict',
      'dist/server/public/ace',
      { recursive: true }
    );
    console.log('✓ Ace Editor files copied to dist/server/public/ace');
  },
});
