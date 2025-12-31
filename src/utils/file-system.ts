import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemError } from './errors.js';

/**
 * Read text file
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
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
 * Read JSON file
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const content = await readTextFile(filePath);
  try {
    return JSON.parse(content) as T;
  } catch (error) {
    if (error instanceof Error) {
      throw new FileSystemError(
        `Failed to parse JSON: ${error.message}`
      );
    }
    throw new FileSystemError('Unknown error occurred during JSON parsing');
  }
}

/**
 * Write text file
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
 * Check if file exists
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
 * Resolve output file path
 * Generate output filename by changing extension from input filename
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
