import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: ['node_modules', 'dist', 'tests/fixtures'],
      all: true,
      include: ['src/**/*.ts'],
    },
    alias: {
      '@': '/Users/kataokakenta/works/rectospec/src',
    },
  },
});
