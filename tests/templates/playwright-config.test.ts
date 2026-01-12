import { describe, it, expect } from 'vitest';
import { generatePlaywrightConfig } from '../../src/templates/playwright-config.js';

describe('generatePlaywrightConfig', () => {
  describe('TypeScript config generation', () => {
    it('should generate TypeScript config with baseURL', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        baseURL: 'http://localhost:3000',
        typescript: true,
      });

      expect(config).toContain("import { defineConfig, devices } from '@playwright/test'");
      expect(config).toContain('export default defineConfig');
      expect(config).toContain("testDir: './tests'");
      expect(config).toContain("baseURL: 'http://localhost:3000'");
      expect(config).toContain('fullyParallel: true');
      expect(config).toContain('retries: process.env.CI ? 2 : 0');
      expect(config).toContain('workers: process.env.CI ? 1 : undefined');
      expect(config).toContain("reporter: 'html'");
      expect(config).toContain("trace: 'on-first-retry'");
      expect(config).toContain("screenshot: 'only-on-failure'");
      expect(config).toContain("name: 'chromium'");
      expect(config).toContain("name: 'firefox'");
      expect(config).toContain("name: 'webkit'");
    });

    it('should generate TypeScript config without baseURL', () => {
      const config = generatePlaywrightConfig({
        testDir: './e2e/tests',
        typescript: true,
      });

      expect(config).toContain("import { defineConfig, devices } from '@playwright/test'");
      expect(config).toContain('export default defineConfig');
      expect(config).toContain("testDir: './e2e/tests'");
      expect(config).not.toContain('baseURL:');
      expect(config).toContain('fullyParallel: true');
    });

    it('should use correct testDir path', () => {
      const config = generatePlaywrightConfig({
        testDir: './custom/path/tests',
        typescript: true,
      });

      expect(config).toContain("testDir: './custom/path/tests'");
    });
  });

  describe('JavaScript config generation', () => {
    it('should generate JavaScript config with baseURL', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        baseURL: 'http://localhost:4000',
        typescript: false,
      });

      expect(config).toContain("const { defineConfig, devices } = require('@playwright/test')");
      expect(config).toContain('module.exports = defineConfig');
      expect(config).toContain("testDir: './tests'");
      expect(config).toContain("baseURL: 'http://localhost:4000'");
      expect(config).toContain('fullyParallel: true');
      expect(config).toContain('retries: process.env.CI ? 2 : 0');
      expect(config).toContain('workers: process.env.CI ? 1 : undefined');
      expect(config).toContain("reporter: 'html'");
      expect(config).toContain("trace: 'on-first-retry'");
      expect(config).toContain("screenshot: 'only-on-failure'");
    });

    it('should generate JavaScript config without baseURL', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        typescript: false,
      });

      expect(config).toContain("const { defineConfig, devices } = require('@playwright/test')");
      expect(config).toContain('module.exports = defineConfig');
      expect(config).toContain("testDir: './tests'");
      expect(config).not.toContain('baseURL:');
    });
  });

  describe('Config content validation', () => {
    it('should include all required Playwright settings', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        typescript: true,
      });

      // Core settings
      expect(config).toContain('fullyParallel: true');
      expect(config).toContain('forbidOnly: !!process.env.CI');
      expect(config).toContain('retries: process.env.CI ? 2 : 0');
      expect(config).toContain('workers: process.env.CI ? 1 : undefined');
      expect(config).toContain("reporter: 'html'");

      // Use settings
      expect(config).toContain("trace: 'on-first-retry'");
      expect(config).toContain("screenshot: 'only-on-failure'");

      // Projects
      expect(config).toContain("name: 'chromium'");
      expect(config).toContain("...devices['Desktop Chrome']");
      expect(config).toContain("name: 'firefox'");
      expect(config).toContain("...devices['Desktop Firefox']");
      expect(config).toContain("name: 'webkit'");
      expect(config).toContain("...devices['Desktop Safari']");
    });

    it('should be valid TypeScript syntax', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        baseURL: 'http://localhost:3000',
        typescript: true,
      });

      // Check for TypeScript-specific syntax
      expect(config).toContain('import');
      expect(config).toContain('export default');
      expect(config).not.toContain('require(');
      expect(config).not.toContain('module.exports');
    });

    it('should be valid JavaScript syntax', () => {
      const config = generatePlaywrightConfig({
        testDir: './tests',
        baseURL: 'http://localhost:3000',
        typescript: false,
      });

      // Check for JavaScript-specific syntax
      expect(config).toContain('require(');
      expect(config).toContain('module.exports');
      expect(config).not.toContain('import {');
      expect(config).not.toContain('export default');
    });
  });
});
