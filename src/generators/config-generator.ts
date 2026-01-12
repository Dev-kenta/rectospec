/**
 * Config Generator Orchestrator
 *
 * Orchestrates the generation of Playwright config files,
 * including existence checks and path calculations.
 */

import path from 'path';
import { fileExists } from '../utils/file-system.js';
import { generatePlaywrightConfig } from '../templates/playwright-config.js';

export interface ConfigGenerationOptions {
  outputDir: string;      // Absolute path to test directory
  baseURL?: string;       // Optional base URL
  typescript: boolean;    // Output format
}

export interface ConfigGenerationResult {
  filename: string;       // e.g., "playwright.config.ts"
  path: string;           // Absolute path to config file
  content: string;        // File content
  skipped: boolean;       // True if existing file was found
}

/**
 * Generate Playwright config file
 *
 * This function:
 * 1. Checks if config file already exists (never overwrite)
 * 2. Calculates correct relative testDir path
 * 3. Calls template generator
 * 4. Returns config file info
 *
 * @param options Configuration generation options
 * @returns Configuration generation result
 */
export async function generateConfigFile(
  options: ConfigGenerationOptions
): Promise<ConfigGenerationResult> {
  const { outputDir, baseURL, typescript } = options;

  // Determine config filename based on output format
  const filename = typescript ? 'playwright.config.ts' : 'playwright.config.js';

  // Config file location is always current working directory (project root)
  const configDir = process.cwd();
  const configPath = path.join(configDir, filename);

  // Check if either .ts or .js config file already exists
  const tsConfigPath = path.join(configDir, 'playwright.config.ts');
  const jsConfigPath = path.join(configDir, 'playwright.config.js');

  const tsExists = await fileExists(tsConfigPath);
  const jsExists = await fileExists(jsConfigPath);

  if (tsExists || jsExists) {
    // Return early with skipped flag
    return {
      filename,
      path: configPath,
      content: '',
      skipped: true,
    };
  }

  // Calculate testDir as relative path from config directory to output directory
  let testDir = path.relative(configDir, outputDir);

  // Ensure testDir uses forward slashes for cross-platform compatibility
  testDir = testDir.replace(/\\/g, '/');

  // Prepend './' if not already present for clarity
  if (!testDir.startsWith('./') && !testDir.startsWith('../')) {
    testDir = './' + testDir;
  }

  // Generate config content using template
  const content = generatePlaywrightConfig({
    testDir,
    baseURL,
    typescript,
  });

  return {
    filename,
    path: configPath,
    content,
    skipped: false,
  };
}
