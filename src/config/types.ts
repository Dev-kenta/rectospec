import { z } from 'zod';

/**
 * プロバイダー名の型
 */
export type ProviderName = 'google' | 'anthropic';

/**
 * 設定ファイルのスキーマ
 */
export const ConfigSchema = z.object({
  llm: z.object({
    provider: z.enum(['google', 'anthropic']),
    model: z.string().optional(),
    apiKeys: z
      .object({
        google: z.string().optional(),
        anthropic: z.string().optional(),
      })
      .optional(),
  }),
  language: z.enum(['ja', 'en']),
  output: z.object({
    framework: z.literal('playwright'),
    typescript: z.boolean(),
  }),
  generation: z.object({
    includeEdgeCases: z.boolean(),
  }),
});

/**
 * 設定の型
 */
export type RecToSpecConfig = z.infer<typeof ConfigSchema>;

/**
 * 設定ファイルの部分更新用の型
 */
export type PartialConfig = Partial<{
  llm: Partial<RecToSpecConfig['llm']>;
  language: RecToSpecConfig['language'];
  output: Partial<RecToSpecConfig['output']>;
  generation: Partial<RecToSpecConfig['generation']>;
}>;
