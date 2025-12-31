import { Command } from 'commander';
import path from 'path';
import { generatePlaywright } from '../../llm/provider.js';
import { readTextFile, writeTextFile } from '../../utils/file-system.js';
import { logger } from '../../utils/logger.js';
import { RecToSpecError } from '../../utils/errors.js';
import { ProviderName } from '../../config/types.js';

interface CompileOptions {
  output?: string;
  typescript: boolean;
  framework: 'playwright';
  provider: ProviderName;
  model?: string;
}

export function setupCompileCommand(program: Command): void {
  program
    .command('compile')
    .description('Generate Playwright test code from Gherkin file')
    .argument('<feature-file>', 'Gherkin feature file path')
    .option('-o, --output <directory>', 'Output directory path', './tests')
    .option('--no-typescript', 'Generate JavaScript instead of TypeScript')
    .option('--framework <framework>', 'Test framework (playwright)', 'playwright')
    .option('-p, --provider <provider>', 'LLM provider (google/anthropic)', 'google')
    .option('-m, --model <model>', 'Model name')
    .action(async (featureFile: string, options: CompileOptions) => {
      try {
        await executeCompile(featureFile, options);
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

async function executeCompile(
  featureFile: string,
  options: CompileOptions
): Promise<void> {
  logger.header('RecToSpec - Playwright Code Generation');

  // 1. Load Gherkin file
  const spinner = logger.spinner('Loading Gherkin file...');
  const featurePath = path.resolve(featureFile);
  const gherkinContent = await readTextFile(featurePath);
  spinner.succeed('Gherkin file loaded');

  logger.info(`Feature file: ${path.basename(featurePath)}`);
  logger.info(`Output directory: ${options.output}`);
  logger.info(`TypeScript: ${options.typescript ? 'Yes' : 'No'}`);

  // 2. Generate Playwright code
  const generationSpinner = logger.spinner('Generating Playwright code...');
  const generatedCode = await generatePlaywright(
    gherkinContent,
    {
      typescript: options.typescript,
      framework: options.framework,
    },
    {
      provider: options.provider,
      model: options.model,
    }
  );
  generationSpinner.succeed('Playwright code generated');

  // 3. Save files
  const saveSpinner = logger.spinner('Saving files...');
  const outputDir = path.resolve(options.output || './tests');

  const files = [
    {
      path: path.join(outputDir, generatedCode.pageObject.filename),
      content: generatedCode.pageObject.code,
      label: 'Page Object',
    },
    {
      path: path.join(outputDir, generatedCode.testSpec.filename),
      content: generatedCode.testSpec.code,
      label: 'Test Spec',
    },
    {
      path: path.join(outputDir, generatedCode.testData.filename),
      content: generatedCode.testData.code,
      label: 'Test Data',
    },
  ];

  for (const file of files) {
    await writeTextFile(file.path, file.content);
  }

  saveSpinner.succeed('Files saved');

  // 4. Display created files
  console.log('');
  logger.success('Playwright test code generated successfully');
  console.log('');
  logger.info('Created files:');
  for (const file of files) {
    console.log(`  - ${file.path}`);
  }

  // 5. Next steps
  console.log('');
  logger.info('Next steps:');
  console.log('  1. Review and customize the generated code');
  console.log('  2. Install Playwright: npm install -D @playwright/test');
  console.log(`  3. Run tests: npx playwright test`);
}
