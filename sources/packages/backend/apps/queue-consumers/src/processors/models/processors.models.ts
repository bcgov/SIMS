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
 * @deprecated please use ProcessSummary from sims/utilities/logger.
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
   * @param message info message.
   * @param appendOnlySummary when true append the message only
   * to summary and not perform logging.
   */
  async info(message: string, appendOnlySummary?: boolean): Promise<void> {
    this.summary.push(message);
    if (!appendOnlySummary) {
      this.loggers?.appLogger.log(message);
      await this.loggers?.jobLogger.log(message);
    }
  }

  /**
   * Warnings issues that did not stopped the process from continue.
   * @param message info message.
   * @param appendOnlySummary when true append the message only
   * to summary and not perform logging.
   */
  async warn(message: string, appendOnlySummary?: boolean): Promise<void> {
    this.warnings.push(message);
    if (!appendOnlySummary) {
      this.loggers?.appLogger.warn(message);
      await this.loggers?.jobLogger.log(`Warning: ${message}`);
    }
  }

  /**
   * Errors that did not stopped the process from continue.
   * @param message info message.
   * @param appendOnlySummary when true append the message only
   * to summary and not perform logging.
   */
  async error(message: string, appendOnlySummary?: boolean): Promise<void> {
    this.errors.push(message);
    if (!appendOnlySummary) {
      this.loggers?.appLogger.error(message);
      await this.loggers?.jobLogger.log(`Error: ${message}`);
    }
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
