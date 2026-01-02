import { describe, it, expect } from 'vitest';
import { parseRecording } from '@/parser/chrome-recorder.js';
import { ParserError } from '@/utils/errors.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('parseRecording', () => {
  describe('valid Chrome Recorder JSON', () => {
    it('should parse valid recording with multiple steps', () => {
      // Load login.json fixture
      const fixturePath = join(__dirname, '../fixtures/recordings/login.json');
      const loginRecording = JSON.parse(readFileSync(fixturePath, 'utf-8'));

      const result = parseRecording(loginRecording);

      expect(result.title).toBe('Login flow');
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.url).toBe('https://example.com/login');
      expect(result.metadata.stepCount).toBe(result.steps.length);
    });

    it('should extract URL from navigate step', () => {
      const recording = {
        title: 'Test',
        steps: [
          {
            type: 'navigate',
            url: 'https://test.com',
          },
        ],
      };

      const result = parseRecording(recording);

      expect(result.metadata.url).toBe('https://test.com');
    });

    it('should convert click step correctly', () => {
      const recording = {
        title: 'Click test',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
          {
            type: 'click',
            selectors: [['#button'], ['button.primary']],
          },
        ],
      };

      const result = parseRecording(recording);

      const clickStep = result.steps.find((s) => s.type === 'click');
      expect(clickStep).toBeDefined();
      expect(clickStep?.type).toBe('click');
      expect(clickStep?.selector).toBe('#button'); // First selector chain's last element
      expect(clickStep?.description).toContain('Click element');
    });

    it('should convert change step correctly', () => {
      const recording = {
        title: 'Form test',
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
          {
            type: 'change',
            value: 'test@example.com',
            selectors: [['#email'], ['input[name="email"]']],
          },
        ],
      };

      const result = parseRecording(recording);

      const changeStep = result.steps.find((s) => s.type === 'change');
      expect(changeStep).toBeDefined();
      expect(changeStep?.type).toBe('change');
      expect(changeStep?.value).toBe('test@example.com');
      expect(changeStep?.selector).toBe('#email'); // First selector chain's last element
      expect(changeStep?.description).toContain('Enter "test@example.com"');
    });
  });

  describe('invalid Chrome Recorder JSON', () => {
    it('should throw ParserError for invalid schema', () => {
      const invalidRecording = {
        // Missing required 'title' field
        steps: [
          {
            type: 'navigate',
            url: 'https://example.com',
          },
        ],
      };

      expect(() => parseRecording(invalidRecording)).toThrow(ParserError);
    });
  });
});
