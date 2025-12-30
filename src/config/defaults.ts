import { RecToSpecConfig } from './types.js';

/**
 * デフォルト設定
 */
export const DEFAULT_CONFIG: RecToSpecConfig = {
  llm: {
    provider: 'google',
    model: undefined, // プロバイダーのデフォルトモデルを使用
  },
  language: 'ja',
  output: {
    framework: 'playwright',
    typescript: true,
  },
  generation: {
    includeEdgeCases: true,
  },
};
