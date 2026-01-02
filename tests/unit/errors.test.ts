import { describe, it, expect } from 'vitest';
import {
  RecToSpecError,
  ParserError,
  LLMError,
} from '@/utils/errors.js';

describe('Error Classes', () => {
  describe('RecToSpecError', () => {
    it('should create error with message and code', () => {
      const error = new RecToSpecError('Test error', 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('RecToSpecError');
      expect(error.stack).toBeDefined();
    });
  });

  describe('ParserError', () => {
    it('should create parser error with correct code', () => {
      const error = new ParserError('Invalid JSON format');

      expect(error).toBeInstanceOf(RecToSpecError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Invalid JSON format');
      expect(error.code).toBe('PARSER_ERROR');
      expect(error.name).toBe('ParserError');
    });
  });

  describe('LLMError', () => {
    it('should create LLM error with provider property', () => {
      const error = new LLMError('API request failed', 'google');

      expect(error).toBeInstanceOf(RecToSpecError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('API request failed');
      expect(error.code).toBe('LLM_ERROR');
      expect(error.name).toBe('LLMError');
      expect(error.provider).toBe('google');
    });
  });
});
