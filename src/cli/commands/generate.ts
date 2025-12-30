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
    .description('Chrome Recorder JSONからGherkinファイルを生成します')
    .argument('<recording-file>', 'Chrome Recorder JSONファイルのパス')
    .option('-o, --output <path>', '出力ファイルパス')
    .option('--lang <language>', '言語設定 (ja/en)', 'ja')
    .option('--no-edge-cases', 'エッジケースシナリオを生成しない')
    .option('-p, --provider <provider>', 'LLMプロバイダー', 'google')
    .option('-m, --model <model>', 'モデル名')
    .action(async (recordingFile: string, options: GenerateOptions) => {
      try {
        await executeGenerate(recordingFile, options);
      } catch (error) {
        if (error instanceof RecToSpecError) {
          logger.error(error.message);
          process.exit(1);
        } else if (error instanceof Error) {
          logger.error(`予期しないエラーが発生しました: ${error.message}`);
          console.error(error.stack);
          process.exit(1);
        } else {
          logger.error('不明なエラーが発生しました');
          process.exit(1);
        }
      }
    });
}

async function executeGenerate(
  recordingFile: string,
  options: GenerateOptions
): Promise<void> {
  logger.header('RecToSpec - Gherkin生成');

  // 1. Recording JSON を読み込み
  const spinner = logger.spinner('Recording JSONを読み込んでいます...');
  const recordingPath = path.resolve(recordingFile);
  const recordingJson = await readJsonFile(recordingPath);
  spinner.succeed('Recording JSONを読み込みました');

  // 2. パース
  const parseSpinner = logger.spinner('Recording JSONを解析しています...');
  const parsedRecording = parseRecording(recordingJson);
  parseSpinner.succeed(
    `Recording JSONを解析しました (${parsedRecording.steps.length} ステップ)`
  );

  logger.info(`タイトル: ${parsedRecording.title}`);
  logger.info(`開始URL: ${parsedRecording.metadata.url}`);

  // 3. Gherkin生成
  const gherkinSpinner = logger.spinner('Gherkinを生成しています...');
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
  gherkinSpinner.succeed('Gherkinを生成しました');

  // 4. ファイル保存
  const outputPath = resolveOutputPath(
    recordingPath,
    options.output,
    '.feature'
  );

  const saveSpinner = logger.spinner('ファイルを保存しています...');
  await writeTextFile(outputPath, gherkin);
  saveSpinner.succeed(`作成完了: ${outputPath}`);

  // 5. 完了メッセージ
  console.log('');
  logger.success('Gherkinファイルの生成が完了しました');
  logger.info(`次のステップ: rectospec compile ${outputPath}`);
}
