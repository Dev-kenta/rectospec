import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { RecToSpecConfig, ConfigSchema, PartialConfig, ProviderName } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

/**
 * Configuration scope
 */
export type ConfigScope = 'local' | 'global';

/**
 * Configuration file paths
 */
const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.rectospec');
const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, 'config.json');
const LOCAL_CONFIG_DIR = '.rectospec';
const LOCAL_CONFIG_FILE = path.join(LOCAL_CONFIG_DIR, 'config.json');

/**
 * Configuration manager class
 */
export class ConfigManager {
  /**
   * Get configuration file path (priority: local > global)
   */
  private async findConfigPath(): Promise<string | null> {
    // 1. Check local config
    try {
      await fs.access(LOCAL_CONFIG_FILE);
      return LOCAL_CONFIG_FILE;
    } catch {
      // Local config not found
    }

    // 2. Check global config
    try {
      await fs.access(GLOBAL_CONFIG_FILE);
      return GLOBAL_CONFIG_FILE;
    } catch {
      // Global config not found
    }

    return null;
  }

  /**
   * Check if configuration file exists
   */
  async exists(): Promise<boolean> {
    const configPath = await this.findConfigPath();
    return configPath !== null;
  }

  /**
   * Load configuration (priority: local > global)
   */
  async load(): Promise<RecToSpecConfig> {
    try {
      const configPath = await this.findConfigPath();
      if (!configPath) {
        return DEFAULT_CONFIG;
      }

      const content = await fs.readFile(configPath, 'utf-8');
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
   * @param config - Configuration to save
   * @param scope - Configuration scope ('local' or 'global'). Defaults to 'local'.
   */
  async save(config: RecToSpecConfig, scope: ConfigScope = 'local'): Promise<void> {
    try {
      const configDir = scope === 'local' ? LOCAL_CONFIG_DIR : GLOBAL_CONFIG_DIR;
      const configFile = scope === 'local' ? LOCAL_CONFIG_FILE : GLOBAL_CONFIG_FILE;

      // Create directory if it doesn't exist
      await fs.mkdir(configDir, { recursive: true });

      // Format and save JSON
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(configFile, content, { mode: 0o600 }); // Save with 600 permissions

      // Explicitly set permissions (just in case)
      await fs.chmod(configFile, 0o600);
    } catch (error) {
      if (error instanceof Error) {
        throw new ConfigError(`Failed to save configuration: ${error.message}`);
      }
      throw new ConfigError('Unknown error occurred while saving configuration');
    }
  }

  /**
   * Update configuration (partial update)
   * @param partialConfig - Partial configuration to merge
   * @param scope - Configuration scope ('local' or 'global'). Defaults to 'local'.
   */
  async update(partialConfig: PartialConfig, scope: ConfigScope = 'local'): Promise<RecToSpecConfig> {
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

    await this.save(updatedConfig, scope);
    return updatedConfig;
  }

  /**
   * Save API key
   * @param provider - LLM provider name
   * @param apiKey - API key value
   * @param scope - Configuration scope ('local' or 'global'). Defaults to 'local'.
   */
  async saveApiKey(provider: ProviderName, apiKey: string, scope: ConfigScope = 'local'): Promise<void> {
    await this.update({
      llm: {
        apiKeys: {
          [provider]: apiKey,
        },
      },
    }, scope);
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
   * Get configuration file path (returns the currently active config path)
   * Priority: local > global
   */
  async getConfigPath(): Promise<string | null> {
    return await this.findConfigPath();
  }

  /**
   * Get specific scope configuration file path
   */
  getConfigPathByScope(scope: ConfigScope): string {
    return scope === 'local' ? LOCAL_CONFIG_FILE : GLOBAL_CONFIG_FILE;
  }
}

/**
 * Singleton instance
 */
export const configManager = new ConfigManager();
