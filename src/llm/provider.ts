import { generateText, generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { ParsedRecording } from '../parser/types.js';
import { LLMError, ConfigError } from '../utils/errors.js';
import { buildGherkinPrompt, GherkinGenerationOptions } from './prompts/gherkin-prompt.js';
import { buildPlaywrightPrompt, PlaywrightGenerationOptions } from './prompts/playwright-prompt.js';
import { configManager } from '../config/manager.js';

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  provider: 'google';
  model?: string;
}

/**
 * Default model settings
 */
const DEFAULT_MODELS = {
  google: 'gemini-2.0-flash-lite',
};

/**
 * Get API key (priority: environment variable > config file)
 */
async function getApiKey(provider: 'google'): Promise<string> {
  const envVars = {
    google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  // 1. Check environment variable
  const envKey = process.env[envVars[provider]];
  if (envKey) {
    return envKey;
  }

  // 2. Check config file
  const configKey = await configManager.getApiKey(provider);
  if (configKey) {
    // Set to environment variable for @ai-sdk/google to use
    process.env[envVars[provider]] = configKey;
    return configKey;
  }

  // 3. Not found
  throw new ConfigError(
    `API key not found. Please set it using one of the following methods:\n` +
      `1. Environment variable: export ${envVars[provider]}=your-key\n` +
      `2. .env file: ${envVars[provider]}=your-key\n` +
      `3. Setup command: rectospec init\n` +
      `\nGet API key: https://aistudio.google.com/app/apikey`
  );
}

/**
 * Generate Gherkin
 */
export async function generateGherkin(
  recording: ParsedRecording,
  options: GherkinGenerationOptions,
  config: Partial<LLMConfig> = {}
): Promise<string> {
  const provider = config.provider || 'google';
  const modelName = config.model || DEFAULT_MODELS[provider];

  // Get API key (environment variable > config file)
  await getApiKey(provider);

  try {
    const prompt = buildGherkinPrompt(recording, options);

    const { text } = await generateText({
      model: google(modelName),
      system: 'You are a QA engineer expert in BDD and Gherkin.',
      prompt,
      temperature: 0.3,
      maxTokens: 4000,
    });

    // Extract Gherkin from code block
    const gherkin = extractGherkinFromResponse(text);

    return gherkin;
  } catch (error) {
    if (error instanceof Error) {
      throw new LLMError(
        `Failed to generate Gherkin: ${error.message}`,
        provider
      );
    }
    throw new LLMError(
      'Unknown error occurred during Gherkin generation',
      provider
    );
  }
}

/**
 * Extract Gherkin code from LLM response
 */
function extractGherkinFromResponse(response: string): string {
  // Extract Gherkin from code block
  const codeBlockMatch = response.match(/```gherkin\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Return as is if no code block
  return response.trim();
}

/**
 * Generated Playwright code structure
 */
export interface GeneratedPlaywrightCode {
  pageObject: {
    filename: string;
    code: string;
  };
  testSpec: {
    filename: string;
    code: string;
  };
  testData: {
    filename: string;
    code: string;
  };
}

/**
 * Zod schema for Playwright code generation
 */
const PlaywrightCodeSchema = z.object({
  pageObject: z.object({
    filename: z.string(),
    code: z.string(),
  }),
  testSpec: z.object({
    filename: z.string(),
    code: z.string(),
  }),
  testData: z.object({
    filename: z.string(),
    code: z.string(),
  }),
});

/**
 * Generate Playwright test code from Gherkin
 */
export async function generatePlaywright(
  gherkinContent: string,
  options: PlaywrightGenerationOptions,
  config: Partial<LLMConfig> = {}
): Promise<GeneratedPlaywrightCode> {
  const provider = config.provider || 'google';
  const modelName = config.model || DEFAULT_MODELS[provider];

  // Get API key (environment variable > config file)
  await getApiKey(provider);

  try {
    const prompt = buildPlaywrightPrompt(gherkinContent, options);

    const { object } = await generateObject({
      model: google(modelName),
      schema: PlaywrightCodeSchema,
      prompt,
      temperature: 0.3,
    });

    return object;
  } catch (error) {
    if (error instanceof Error) {
      throw new LLMError(
        `Failed to generate Playwright code: ${error.message}`,
        provider
      );
    }
    throw new LLMError(
      'Unknown error occurred during Playwright code generation',
      provider
    );
  }
}
