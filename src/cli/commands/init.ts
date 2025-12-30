import { Command } from 'commander';
import inquirer from 'inquirer';
import { configManager } from '../../config/manager.js';
import { ProviderName } from '../../config/types.js';
import { logger } from '../../utils/logger.js';
import { RecToSpecError } from '../../utils/errors.js';

interface InitAnswers {
  provider: ProviderName;
  googleApiKey?: string;
  anthropicApiKey?: string;
  language: 'ja' | 'en';
  includeEdgeCases: boolean;
}

export function setupInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize RecToSpec configuration')
    .option('-f, --force', 'Overwrite existing configuration')
    .action(async (options: { force?: boolean }) => {
      try {
        await executeInit(options);
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

async function executeInit(options: { force?: boolean }): Promise<void> {
  logger.header('RecToSpec - Initial Setup');

  // Check existing configuration
  const exists = await configManager.exists();
  if (exists && !options.force) {
    logger.warn('Configuration file already exists');
    const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing configuration?',
        default: false,
      },
    ]);

    if (!overwrite) {
      logger.info('Setup cancelled');
      return;
    }
  }

  // Interactive setup
  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: 'list',
      name: 'provider',
      message: 'Select LLM provider:',
      choices: [
        {
          name: 'Google Gemini (Recommended)',
          value: 'google',
        },
        {
          name: 'Anthropic Claude (Not implemented yet)',
          value: 'anthropic',
          disabled: true,
        },
      ],
      default: 'google',
    },
    {
      type: 'password',
      name: 'googleApiKey',
      message: 'Enter Google Gemini API key:',
      when: (answers) => answers.provider === 'google',
      validate: (input: string) => {
        if (!input || input.trim() === '') {
          return 'Please enter an API key';
        }
        return true;
      },
    },
    {
      type: 'list',
      name: 'language',
      message: 'Select Gherkin generation language:',
      choices: [
        { name: 'Japanese', value: 'ja' },
        { name: 'English', value: 'en' },
      ],
      default: 'ja',
    },
    {
      type: 'confirm',
      name: 'includeEdgeCases',
      message: 'Generate edge case scenarios automatically?',
      default: true,
    },
  ]);

  // Save configuration
  const spinner = logger.spinner('Saving configuration...');

  try {
    // Save API key
    if (answers.provider === 'google' && answers.googleApiKey) {
      await configManager.saveApiKey('google', answers.googleApiKey);
    }

    // Update other settings
    await configManager.update({
      llm: {
        provider: answers.provider,
      },
      language: answers.language,
      generation: {
        includeEdgeCases: answers.includeEdgeCases,
      },
    });

    spinner.succeed('Configuration saved');

    // Display config file path
    const configPath = configManager.getConfigPath();
    logger.info(`Config file: ${configPath}`);

    console.log('');
    logger.success('Setup completed!');
    logger.info('Next step: rectospec generate <recording.json>');
  } catch (error) {
    spinner.fail('Failed to save configuration');
    throw error;
  }
}
