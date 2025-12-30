import chalk from 'chalk';
import ora, { Ora } from 'ora';

/**
 * Logger class
 * Provides readable log output for CLI
 */
class Logger {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  warn(message: string): void {
    console.warn(chalk.yellow('⚠'), message);
  }

  spinner(message: string): Ora {
    return ora(message).start();
  }

  /**
   * Display header
   */
  header(message: string): void {
    console.log(chalk.bold.cyan(`\n${message}\n${'='.repeat(message.length)}`));
  }

  /**
   * Display section
   */
  section(message: string): void {
    console.log(chalk.bold(`\n${message}`));
  }
}

export const logger = new Logger();
