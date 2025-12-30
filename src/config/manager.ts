import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { RecToSpecConfig, ConfigSchema, PartialConfig, ProviderName } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

/**
 * Configuration file paths
 */
const CONFIG_DIR = path.join(os.homedir(), '.rectospec');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Configuration manager class
 */
export class ConfigManager {
  /**
   * Check if configuration file exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(CONFIG_FILE);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Load configuration
   */
  async load(): Promise<RecToSpecConfig> {
    try {
      const exists = await this.exists();
      if (!exists) {
        return DEFAULT_CONFIG;
      }

      const content = await fs.readFile(CONFIG_FILE, 'utf-8');
      const json = JSON.parse(content);

      // Validate with Zod
      const result = ConfigSchema.safeParse(json);
      if (!result.success) {
        throw new ConfigError(
          `Invalid configuration file format: ${result.error.message}`
        );
      }

      return result.data;
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConfigError(`Failed to load configuration: ${error.message}`);
      }
      throw new ConfigError('Unknown error occurred while loading configuration');
    }
  }

  /**
   * Save configuration
   */
  async save(config: RecToSpecConfig): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(CONFIG_DIR, { recursive: true });

      // Format and save JSON
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(CONFIG_FILE, content, { mode: 0o600 }); // Save with 600 permissions

      // Explicitly set permissions (just in case)
      await fs.chmod(CONFIG_FILE, 0o600);
    } catch (error) {
      if (error instanceof Error) {
        throw new ConfigError(`Failed to save configuration: ${error.message}`);
      }
      throw new ConfigError('Unknown error occurred while saving configuration');
    }
  }

  /**
   * Update configuration (partial update)
   */
  async update(partialConfig: PartialConfig): Promise<RecToSpecConfig> {
    const currentConfig = await this.load();

    const updatedConfig: RecToSpecConfig = {
      ...currentConfig,
      ...partialConfig,
      llm: {
        ...currentConfig.llm,
        ...partialConfig.llm,
        apiKeys: {
          ...currentConfig.llm.apiKeys,
          ...partialConfig.llm?.apiKeys,
        },
      },
      output: {
        ...currentConfig.output,
        ...partialConfig.output,
      },
      generation: {
        ...currentConfig.generation,
        ...partialConfig.generation,
      },
    };

    await this.save(updatedConfig);
    return updatedConfig;
  }

  /**
   * Save API key
   */
  async saveApiKey(provider: ProviderName, apiKey: string): Promise<void> {
    await this.update({
      llm: {
        apiKeys: {
          [provider]: apiKey,
        },
      },
    });
  }

  /**
   * Get API key (priority: environment variable > .env > config file)
   */
  async getApiKey(provider: ProviderName): Promise<string | undefined> {
    // 1. Check environment variable
    const envVars: Record<ProviderName, string> = {
      google: 'GOOGLE_GENERATIVE_AI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
    };

    const envKey = process.env[envVars[provider]];
    if (envKey) {
      return envKey;
    }

    // 2. Check config file
    const config = await this.load();
    return config.llm.apiKeys?.[provider];
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return CONFIG_FILE;
  }
}

/**
 * Singleton instance
 */
export const configManager = new ConfigManager();
