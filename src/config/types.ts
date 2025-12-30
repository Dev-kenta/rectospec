import { z } from 'zod';

/**
 * Provider name type
 */
export type ProviderName = 'google' | 'anthropic';

/**
 * Configuration file schema
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
 * Configuration type
 */
export type RecToSpecConfig = z.infer<typeof ConfigSchema>;

/**
 * Partial configuration type for updates
 */
export type PartialConfig = Partial<{
  llm: Partial<RecToSpecConfig['llm']>;
  language: RecToSpecConfig['language'];
  output: Partial<RecToSpecConfig['output']>;
  generation: Partial<RecToSpecConfig['generation']>;
}>;
