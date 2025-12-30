import { Command } from 'commander';
import path from 'path';
import { parseRecording } from '../../parser/chrome-recorder.js';
import { generateGherkin } from '../../llm/provider.js';
import { readJsonFile, writeTextFile, resolveOutputPath } from '../../utils/file-system.js';
import { logger } from '../../utils/logger.js';
import { RecToSpecError } from '../../utils/errors.js';

interface GenerateOptions {
  output?: string;
  lang: 'ja' | 'en';
  edgeCases: boolean;
  provider: 'google';
  model?: string;
}

export function setupGenerateCommand(program: Command): void {
  program
    .command('generate')
    .description('Generate Gherkin file from Chrome Recorder JSON')
    .argument('<recording-file>', 'Chrome Recorder JSON file path')
    .option('-o, --output <path>', 'Output file path')
    .option('--lang <language>', 'Language (ja/en)', 'ja')
    .option('--no-edge-cases', 'Do not generate edge case scenarios')
    .option('-p, --provider <provider>', 'LLM provider', 'google')
    .option('-m, --model <model>', 'Model name')
    .action(async (recordingFile: string, options: GenerateOptions) => {
      try {
        await executeGenerate(recordingFile, options);
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

async function executeGenerate(
  recordingFile: string,
  options: GenerateOptions
): Promise<void> {
  logger.header('RecToSpec - Gherkin Generation');

  // 1. Load Recording JSON
  const spinner = logger.spinner('Loading Recording JSON...');
  const recordingPath = path.resolve(recordingFile);
  const recordingJson = await readJsonFile(recordingPath);
  spinner.succeed('Recording JSON loaded');

  // 2. Parse
  const parseSpinner = logger.spinner('Parsing Recording JSON...');
  const parsedRecording = parseRecording(recordingJson);
  parseSpinner.succeed(
    `Recording JSON parsed (${parsedRecording.steps.length} steps)`
  );

  logger.info(`Title: ${parsedRecording.title}`);
  logger.info(`Start URL: ${parsedRecording.metadata.url}`);

  // 3. Generate Gherkin
  const gherkinSpinner = logger.spinner('Generating Gherkin...');
  const gherkin = await generateGherkin(
    parsedRecording,
    {
      language: options.lang,
      includeEdgeCases: options.edgeCases,
    },
    {
      provider: options.provider,
      model: options.model,
    }
  );
  gherkinSpinner.succeed('Gherkin generated');

  // 4. Save file
  const outputPath = resolveOutputPath(
    recordingPath,
    options.output,
    '.feature'
  );

  // Show output destination
  if (options.output) {
    logger.info(`Output: ${outputPath}`);
  }

  const saveSpinner = logger.spinner('Saving file...');
  await writeTextFile(outputPath, gherkin);
  saveSpinner.succeed(`Created: ${outputPath}`);

  // 5. Completion message
  console.log('');
  logger.success('Gherkin file generated successfully');
  logger.info(`Next step: rectospec compile ${outputPath}`);
}
