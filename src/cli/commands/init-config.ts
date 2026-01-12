import { Command } from 'commander';
import path from 'path';
import { generateConfigFile } from '../../generators/config-generator.js';
import { writeTextFile } from '../../utils/file-system.js';
import { logger } from '../../utils/logger.js';
import { RecToSpecError } from '../../utils/errors.js';

interface InitConfigOptions {
  output: string;
  typescript: boolean;
  baseUrl?: string;
}

export function setupInitConfigCommand(program: Command): void {
  program
    .command('init-config')
    .description('Generate Playwright configuration file')
    .option('-o, --output <directory>', 'Test directory path', './tests')
    .option('--no-typescript', 'Generate JavaScript config instead of TypeScript')
    .option('--base-url <url>', 'Base URL for Playwright config')
    .action(async (options: InitConfigOptions) => {
      try {
        await executeInitConfig(options);
      } catch (error) {
        if (error instanceof RecToSpecError) {
          logger.error(error.message);
          process.exit(1);
        } else if (error instanceof Error) {
          logger.error(`Unexpected error occurred: ${error.message}`);
          console.error(error.stack);
          process.exit(1);
        } else {
          logger.error('Unknown error occurred');
          process.exit(1);
        }
      }
    });
}

async function executeInitConfig(options: InitConfigOptions): Promise<void> {
  logger.header('RecToSpec - Playwright Config Generation');

  // Resolve output directory to absolute path
  const outputDir = path.resolve(options.output);

  logger.info(`Test directory: ${options.output}`);
  logger.info(`TypeScript: ${options.typescript ? 'Yes' : 'No'}`);
  if (options.baseUrl) {
    logger.info(`Base URL: ${options.baseUrl}`);
  }

  // Generate config file
  const spinner = logger.spinner('Generating Playwright config...');
  const configResult = await generateConfigFile({
    outputDir,
    baseURL: options.baseUrl,
    typescript: options.typescript,
  });

  if (configResult.skipped) {
    spinner.warn('Config file already exists, skipping');
    console.log('');
    logger.info(`Existing config file: ${configResult.path}`);
    console.log('');
    logger.info('To regenerate the config file:');
    console.log('  1. Remove or rename the existing config file');
    console.log('  2. Run this command again');
    return;
  }

  // Write config file
  await writeTextFile(configResult.path, configResult.content);
  spinner.succeed('Playwright config generated');

  // Display created file
  console.log('');
  logger.success('Playwright configuration file created successfully');
  console.log('');
  logger.info('Created file:');
  console.log(`  - ${configResult.path}`);

  // Next steps
  console.log('');
  logger.info('Next steps:');
  console.log('  1. Review and customize the configuration if needed');
  console.log('  2. Install Playwright: npm install -D @playwright/test');
  console.log('  3. Generate test code: rectospec compile <feature-file>');
  console.log('  4. Run tests: npx playwright test');
}
