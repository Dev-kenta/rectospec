import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemError } from './errors.js';

/**
 * JSON ファイルを読み込む
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      if ('code' in error && error.code === 'ENOENT') {
        throw new FileSystemError(
          `File not found: ${filePath}`
        );
      }
      throw new FileSystemError(
        `Failed to read file: ${error.message}`
      );
    }
    throw new FileSystemError('Unknown error occurred');
  }
}

/**
 * テキストファイルを書き込む
 */
export async function writeTextFile(
  filePath: string,
  content: string
): Promise<void> {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    if (error instanceof Error) {
      throw new FileSystemError(
        `Failed to write file: ${error.message}`
      );
    }
    throw new FileSystemError('Unknown error occurred');
  }
}

/**
 * ファイルの存在を確認
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 出力ファイルパスを解決
 * 入力ファイル名から拡張子を変更して出力ファイル名を生成
 */
export function resolveOutputPath(
  inputPath: string,
  outputPath: string | undefined,
  newExtension: string
): string {
  if (outputPath) {
    // Resolve to absolute path (handles both relative and absolute paths)
    return path.resolve(outputPath);
  }

  // Generate output path in the same directory as input file
  const parsedPath = path.parse(inputPath);
  return path.join(parsedPath.dir, `${parsedPath.name}${newExtension}`);
}
