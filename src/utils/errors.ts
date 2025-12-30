/**
 * Custom error classes
 */

export class RecToSpecError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'RecToSpecError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ParserError extends RecToSpecError {
  constructor(message: string) {
    super(message, 'PARSER_ERROR');
    this.name = 'ParserError';
  }
}

export class LLMError extends RecToSpecError {
  constructor(
    message: string,
    public provider: string
  ) {
    super(message, 'LLM_ERROR');
    this.name = 'LLMError';
  }
}

export class ConfigError extends RecToSpecError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

export class FileSystemError extends RecToSpecError {
  constructor(message: string) {
    super(message, 'FILE_SYSTEM_ERROR');
    this.name = 'FileSystemError';
  }
}
