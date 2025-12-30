import { Command } from 'commander';
import { config } from 'dotenv';
import { setupGenerateCommand } from './commands/generate.js';
import { setupInitCommand } from './commands/init.js';

// Load .env file
config();

const program = new Command();

program
  .name('rectospec')
  .description('Chrome Recorder to Gherkin to Playwright - AI-powered test automation tool')
  .version('0.1.0');

// Setup commands
setupInitCommand(program);
setupGenerateCommand(program);

// Customize help text
program.addHelpText(
  'after',
  `
Examples:
  $ rectospec init
  $ rectospec generate recording.json
  $ rectospec generate recording.json -o test.feature
  $ rectospec generate recording.json --lang en
  $ rectospec generate recording.json --no-edge-cases

Documentation:
  https://github.com/rectospec/rectospec

Get started:
  1. Setup: rectospec init
  2. Record browser actions with Chrome Recorder and export as JSON
  3. Generate Gherkin: rectospec generate recording.json
`
);

program.parse();
