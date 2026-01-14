import { Command } from 'commander';
import { config } from 'dotenv';
import { setupGenerateCommand } from './commands/generate.js';
import { setupInitCommand } from './commands/init.js';
import { setupInitConfigCommand } from './commands/init-config.js';
import { setupCompileCommand } from './commands/compile.js';
import { setupEditCommand } from './commands/edit.js';

// Load .env file
config();

const program = new Command();

program
  .name('rectospec')
  .description('Chrome Recorder to Gherkin to Playwright - AI-powered test automation tool')
  .version('0.3.1');

// Setup commands
setupInitCommand(program);
setupInitConfigCommand(program);
setupGenerateCommand(program);
setupCompileCommand(program);
setupEditCommand(program);

// Customize help text
program.addHelpText(
  'after',
  `
Examples:
  $ rectospec init
  $ rectospec init-config
  $ rectospec init-config --output ./e2e/tests
  $ rectospec init-config --base-url http://localhost:3000
  $ rectospec init-config --no-typescript
  $ rectospec generate recording.json
  $ rectospec generate recording.json -o test.feature
  $ rectospec generate recording.json --lang en
  $ rectospec generate recording.json --no-edge-cases
  $ rectospec edit test.feature
  $ rectospec edit test.feature --port 8080
  $ rectospec edit test.feature --no-open
  $ rectospec compile test.feature -o ./tests
  $ rectospec compile test.feature --no-typescript

Documentation:
  https://github.com/Dev-kenta/rectospec

Get started:
  1. Setup: rectospec init
  2. Record browser actions with Chrome Recorder and export as JSON
  3. Generate Gherkin: rectospec generate recording.json
  4. Edit (optional): rectospec edit test.feature
  5. Generate Playwright config: rectospec init-config
  6. Compile to Playwright: rectospec compile test.feature
`
);

program.parse();
