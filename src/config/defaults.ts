import { RecToSpecConfig } from './types.js';

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: RecToSpecConfig = {
  llm: {
    provider: 'google',
    model: undefined, // Use provider's default model
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
