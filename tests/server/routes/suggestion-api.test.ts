import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorServer } from '../../../src/server/server.js';
import { ServerInstance } from '../../../src/server/types.js';

// Mock the LLM provider
vi.mock('../../../src/llm/provider.js', () => ({
  generateSuggestion: vi.fn(),
}));

import { generateSuggestion } from '../../../src/llm/provider.js';

describe('Suggestion API', () => {
  let server: EditorServer;
  let instance: ServerInstance | null = null;

  beforeEach(async () => {
    // Start server on port 9300
    server = new EditorServer({ port: 9300 });
    instance = await server.start();

    // Reset mock
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Shutdown server
    if (instance) {
      await server.shutdown();
      instance = null;
    }
  });

  describe('POST /api/suggest', () => {
    it('should generate suggestion successfully', async () => {
      const mockSuggestion = `# Language: en
Feature: User Login
  As a user
  I want to login to the system
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter email "user@example.com"
    And I enter password "password123"
    And I click the login button
    Then I should be redirected to the dashboard`;

      // Setup mock
      vi.mocked(generateSuggestion).mockResolvedValue(mockSuggestion);

      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Feature: Login\n  Scenario: Login',
          language: 'en',
          focusArea: 'clarity',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.suggestion).toBe(mockSuggestion);
      expect(data.language).toBe('en');
      expect(data.focusArea).toBe('clarity');

      // Verify generateSuggestion was called with correct options
      expect(generateSuggestion).toHaveBeenCalledWith({
        currentContent: 'Feature: Login\n  Scenario: Login',
        language: 'en',
        focusArea: 'clarity',
      });
    });

    it('should use default focusArea when not provided', async () => {
      const mockSuggestion = 'Feature: Test';

      vi.mocked(generateSuggestion).mockResolvedValue(mockSuggestion);

      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Feature: Test',
          language: 'en',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.focusArea).toBe('all');

      expect(generateSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          focusArea: 'all',
        })
      );
    });

    it('should return 400 if content is missing', async () => {
      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'en',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content is required');
    });

    it('should return 400 if language is invalid', async () => {
      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Feature: Test',
          language: 'fr',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid language');
    });

    it('should return 400 if focusArea is invalid', async () => {
      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Feature: Test',
          language: 'en',
          focusArea: 'invalid',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid focus area');
    });

    it('should return 500 on LLM error', async () => {
      // Setup mock to throw error
      vi.mocked(generateSuggestion).mockRejectedValue(
        new Error('LLM API error')
      );

      const response = await fetch(`${instance!.url}/api/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Feature: Test',
          language: 'en',
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
