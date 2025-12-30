import { Command } from 'commander';
import { config } from 'dotenv';
import { setupGenerateCommand } from './commands/generate.js';

// .env ファイルを読み込み
config();

const program = new Command();

program
  .name('rectospec')
  .description('Chrome Recorder to Gherkin to Playwright - AI-powered test automation tool')
  .version('0.1.0');

// コマンドをセットアップ
setupGenerateCommand(program);

// ヘルプテキストをカスタマイズ
program.addHelpText(
  'after',
  `
Examples:
  $ rectospec generate recording.json
  $ rectospec generate recording.json -o test.feature
  $ rectospec generate recording.json --lang en
  $ rectospec generate recording.json --no-edge-cases

Documentation:
  https://github.com/rectospec/rectospec

Get started:
  1. 環境変数を設定: export GOOGLE_GENERATIVE_AI_API_KEY=your-key
  2. Chrome Recorder でブラウザ操作を記録してJSONエクスポート
  3. rectospec generate recording.json でGherkin生成
`
);

program.parse();
