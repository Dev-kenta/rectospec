import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { ParsedRecording } from '../parser/types.js';
import { LLMError, ConfigError } from '../utils/errors.js';
import { buildGherkinPrompt, GherkinGenerationOptions } from './prompts/gherkin-prompt.js';
import { configManager } from '../config/manager.js';

/**
 * LLM プロバイダー設定
 */
export interface LLMConfig {
  provider: 'google';
  model?: string;
}

/**
 * デフォルトモデル設定
 */
const DEFAULT_MODELS = {
  google: 'gemini-2.0-flash-exp',
};

/**
 * APIキーを取得（環境変数 > 設定ファイル）
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
 * Gherkin を生成
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

    // コードブロックから Gherkin を抽出
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
 * LLMレスポンスからGherkinコードを抽出
 */
function extractGherkinFromResponse(response: string): string {
  // コードブロック内のGherkinを抽出
  const codeBlockMatch = response.match(/```gherkin\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // コードブロックがない場合は、そのまま返す
  return response.trim();
}
