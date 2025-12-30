import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { ParsedRecording } from '../parser/types.js';
import { LLMError, ConfigError } from '../utils/errors.js';
import { buildGherkinPrompt, GherkinGenerationOptions } from './prompts/gherkin-prompt.js';

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
 * 環境変数からAPIキーが設定されているか確認
 */
function validateApiKey(provider: 'google'): void {
  const envVars = {
    google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  };

  const envKey = process.env[envVars[provider]];

  if (!envKey) {
    throw new ConfigError(
      `APIキーが見つかりません。以下のいずれかの方法で設定してください:\n` +
        `1. 環境変数: export ${envVars[provider]}=your-key\n` +
        `2. .envファイル: ${envVars[provider]}=your-key\n` +
        `3. 設定コマンド: rectospec init (未実装)\n` +
        `\nAPIキーの取得方法: https://aistudio.google.com/app/apikey`
    );
  }
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

  // APIキーが環境変数に設定されているか確認
  validateApiKey(provider);

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
        `Gherkin生成に失敗しました: ${error.message}`,
        provider
      );
    }
    throw new LLMError(
      'Gherkin生成中に不明なエラーが発生しました',
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
