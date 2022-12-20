import { LoggerService } from "@nestjs/common";

export interface QueueProcessSummaryResult {
  /**
   * General log for the queue processing.
   */
  summary: string[];
  /**
   * Warnings issues that did not stopped the process from continue.
   */
  warnings: string[];
  /**
   * Errors that did not stopped the process from continue.
   */
  errors: string[];
}

/**
 * Allow the logs aggregation for a process summary and optionally
 * allow the same logs to be saved to different outputs.
 */
export class QueueProcessSummary {
  private summary: string[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];

  constructor(
    private loggers?: { appLogger?: LoggerService; jobLogger?: JobLogger },
  ) {}

  /**
   * General log for the queue processing.
   */
  async info(message: string): Promise<void> {
    this.summary.push(message);
    this.loggers?.appLogger.log(message);
    await this.loggers?.jobLogger.log(message);
  }

  /**
   * Warnings issues that did not stopped the process from continue.
   */
  async warn(message: string): Promise<void> {
    this.warnings.push(message);
    this.loggers?.appLogger.warn(message);
    await this.loggers?.jobLogger.log(`Warning: ${message}`);
  }

  /**
   * Errors that did not stopped the process from continue.
   */
  async error(message: string): Promise<void> {
    this.errors.push(message);
    this.loggers?.appLogger.error(message);
    await this.loggers?.jobLogger.log(`Error: ${message}`);
  }

  /**
   * Get all general logs, warnings, and errors.
   * @returns all general logs, warnings, and errors combined.
   */
  getSummary(): QueueProcessSummaryResult {
    return {
      summary: this.summary.length ? this.summary : undefined,
      warnings: this.warnings.length ? this.warnings : undefined,
      errors: this.errors.length ? this.errors : undefined,
    };
  }
}

/**
 * Log capability provided by a queue job.
 */
export interface JobLogger {
  log(message: string): Promise<void>;
}
