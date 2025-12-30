import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { RecToSpecConfig, ConfigSchema, PartialConfig, ProviderName } from './types.js';
import { DEFAULT_CONFIG } from './defaults.js';
import { ConfigError } from '../utils/errors.js';

/**
 * 設定ファイルのパス
 */
const CONFIG_DIR = path.join(os.homedir(), '.rectospec');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * 設定管理クラス
 */
export class ConfigManager {
  /**
   * 設定ファイルが存在するか確認
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
   * 設定を読み込む
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
   * 設定を保存
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
   * 設定を更新（部分更新）
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
   * APIキーを保存
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
   * APIキーを取得（優先順位: 環境変数 > .env > 設定ファイル）
   */
  async getApiKey(provider: ProviderName): Promise<string | undefined> {
    // 1. 環境変数をチェック
    const envVars: Record<ProviderName, string> = {
      google: 'GOOGLE_GENERATIVE_AI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY',
    };

    const envKey = process.env[envVars[provider]];
    if (envKey) {
      return envKey;
    }

    // 2. 設定ファイルをチェック
    const config = await this.load();
    return config.llm.apiKeys?.[provider];
  }

  /**
   * 設定ファイルのパスを取得
   */
  getConfigPath(): string {
    return CONFIG_FILE;
  }
}

/**
 * シングルトンインスタンス
 */
export const configManager = new ConfigManager();
