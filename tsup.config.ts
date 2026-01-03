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
  },
});
