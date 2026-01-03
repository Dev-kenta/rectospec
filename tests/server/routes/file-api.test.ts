import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EditorServer } from '../../../src/server/server.js';
import { ServerInstance } from '../../../src/server/types.js';
import { writeTextFile } from '../../../src/utils/file-system.js';
import path from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import { rm } from 'fs/promises';

describe('File API', () => {
  let server: EditorServer;
  let instance: ServerInstance | null = null;
  let testDir: string;
  let testFile: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(tmpdir(), `rectospec-test-${randomBytes(8).toString('hex')}`);
    testFile = path.join(testDir, 'test.feature');

    // Write test file
    await writeTextFile(testFile, 'Feature: Test\n  Scenario: Test scenario\n');

    // Start server on port 9200
    server = new EditorServer({ port: 9200 });
    instance = await server.start();
  });

  afterEach(async () => {
    // Shutdown server
    if (instance) {
      await server.shutdown();
      instance = null;
    }

    // Cleanup test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe('GET /api/file', () => {
    it('should return file content for valid .feature file', async () => {
      const response = await fetch(
        `${instance!.url}/api/file?path=${encodeURIComponent(testFile)}`
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.content).toBe('Feature: Test\n  Scenario: Test scenario\n');
      expect(data.path).toBe(testFile);
    });

    it('should return 400 if file path is missing', async () => {
      const response = await fetch(`${instance!.url}/api/file`);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File path is required');
    });

    it('should return 400 if file is not a .feature file', async () => {
      const invalidFile = path.join(testDir, 'test.json');
      const response = await fetch(
        `${instance!.url}/api/file?path=${encodeURIComponent(invalidFile)}`
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid file type');
    });

    it('should return 404 if file does not exist', async () => {
      const nonExistentFile = path.join(testDir, 'nonexistent.feature');
      const response = await fetch(
        `${instance!.url}/api/file?path=${encodeURIComponent(nonExistentFile)}`
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('File not found');
    });
  });
});
