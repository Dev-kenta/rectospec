import { Command } from 'commander';
import path from 'path';
import open from 'open';
import { EditorServer } from '../../server/server.js';
import { fileExists } from '../../utils/file-system.js';
import { logger } from '../../utils/logger.js';
import { RecToSpecError, FileSystemError } from '../../utils/errors.js';

interface EditOptions {
  port: number;
  open: boolean;
}

export function setupEditCommand(program: Command): void {
  program
    .command('edit')
    .description('Edit Gherkin feature file in browser')
    .argument('<file>', 'Path to Gherkin feature file')
    .option('-p, --port <number>', 'Server port', parseInt, 3000)
    .option('--no-open', 'Do not open browser automatically')
    .action(async (file: string, options: EditOptions) => {
      try {
        await executeEdit(file, options);
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

async function executeEdit(
  file: string,
  options: EditOptions
): Promise<void> {
  logger.header('RecToSpec - Gherkin Editor');

  // 1. Validate file path
  const filePath = path.resolve(file);

  // Check file extension
  if (!filePath.endsWith('.feature')) {
    throw new FileSystemError(
      'Invalid file type. Only .feature files are supported.'
    );
  }

  // Check file exists
  const exists = await fileExists(filePath);
  if (!exists) {
    throw new FileSystemError(
      `File not found: ${filePath}`
    );
  }

  logger.info(`File: ${filePath}`);

  // 2. Start server
  const serverSpinner = logger.spinner('Starting editor server...');
  const server = new EditorServer({ port: options.port });

  try {
    const instance = await server.start();
    serverSpinner.succeed(`Server started at ${instance.url}`);

    // 3. Open browser
    if (options.open) {
      const browserSpinner = logger.spinner('Opening browser...');
      const editorUrl = `${instance.url}?file=${encodeURIComponent(filePath)}`;
      await open(editorUrl);
      browserSpinner.succeed('Browser opened');
    }

    console.log('');
    logger.success('Editor is ready');
    logger.info('Press Ctrl+C to stop the server');

    // 4. Keep server running
    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('');
      const shutdownSpinner = logger.spinner('Shutting down server...');
      await server.shutdown();
      shutdownSpinner.succeed('Server shut down');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    await server.shutdown().catch(() => {});
    throw error;
  }
}
