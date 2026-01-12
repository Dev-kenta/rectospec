import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { generateConfigFile } from '../../src/generators/config-generator.js';

describe('generateConfigFile', () => {
  // Test with a temporary directory to avoid affecting actual project
  let originalCwd: string;
  let tempDir: string;

  beforeEach(async () => {
    // Save original cwd
    originalCwd = process.cwd();

    // Create temporary directory
    tempDir = path.join(process.cwd(), 'temp-test-config-gen');
    await fs.mkdir(tempDir, { recursive: true });

    // Change to temp directory for testing
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original cwd
    process.chdir(originalCwd);

    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Config file generation', () => {
    it('should generate config file when none exists', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      expect(result.skipped).toBe(false);
      expect(result.filename).toBe('playwright.config.ts');
      expect(result.path).toBe(path.join(tempDir, 'playwright.config.ts'));
      expect(result.content).toContain('export default defineConfig');
      expect(result.content).toContain("testDir: './tests'");
    });

    it('should generate JavaScript config when typescript is false', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        typescript: false,
      });

      expect(result.skipped).toBe(false);
      expect(result.filename).toBe('playwright.config.js');
      expect(result.path).toBe(path.join(tempDir, 'playwright.config.js'));
      expect(result.content).toContain('module.exports = defineConfig');
    });

    it('should include baseURL when provided', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        baseURL: 'http://localhost:3000',
        typescript: true,
      });

      expect(result.skipped).toBe(false);
      expect(result.content).toContain("baseURL: 'http://localhost:3000'");
    });
  });

  describe('Existence checks', () => {
    it('should skip if playwright.config.ts exists', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      // Create existing TypeScript config
      await fs.writeFile(
        path.join(tempDir, 'playwright.config.ts'),
        'export default {};'
      );

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      expect(result.skipped).toBe(true);
      expect(result.content).toBe('');
    });

    it('should skip if playwright.config.js exists', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      // Create existing JavaScript config
      await fs.writeFile(
        path.join(tempDir, 'playwright.config.js'),
        'module.exports = {};'
      );

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      expect(result.skipped).toBe(true);
      expect(result.content).toBe('');
    });

    it('should skip if JavaScript config exists when generating TypeScript', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      // Create existing JavaScript config
      await fs.writeFile(
        path.join(tempDir, 'playwright.config.js'),
        'module.exports = {};'
      );

      const result = await generateConfigFile({
        outputDir,
        typescript: true,  // Requesting TypeScript
      });

      expect(result.skipped).toBe(true);
    });
  });

  describe('Path calculations', () => {
    it('should calculate correct relative testDir path', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      expect(result.content).toContain("testDir: './tests'");
    });

    it('should handle nested output directories', async () => {
      const outputDir = path.join(tempDir, 'e2e', 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      expect(result.content).toContain("testDir: './e2e/tests'");
    });

    it('should use forward slashes for cross-platform compatibility', async () => {
      const outputDir = path.join(tempDir, 'nested', 'path', 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        typescript: true,
      });

      // Check that path uses forward slashes
      expect(result.content).toMatch(/testDir: '\.\/(nested\/path\/tests|[^']*)'/)
      expect(result.content).not.toContain('\\');
    });
  });

  describe('ConfigGenerationResult structure', () => {
    it('should return correct ConfigGenerationResult structure', async () => {
      const outputDir = path.join(tempDir, 'tests');
      await fs.mkdir(outputDir, { recursive: true });

      const result = await generateConfigFile({
        outputDir,
        baseURL: 'http://localhost:3000',
        typescript: true,
      });

      // Verify structure
      expect(result).toHaveProperty('filename');
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('skipped');

      // Verify types
      expect(typeof result.filename).toBe('string');
      expect(typeof result.path).toBe('string');
      expect(typeof result.content).toBe('string');
      expect(typeof result.skipped).toBe('boolean');

      // Verify values
      expect(result.filename).toBe('playwright.config.ts');
      expect(path.isAbsolute(result.path)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);
      expect(result.skipped).toBe(false);
    });
  });
});
