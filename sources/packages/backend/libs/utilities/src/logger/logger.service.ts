import { Injectable, ConsoleLogger, Scope } from "@nestjs/common";
import { LogLevels, ProcessSummary } from "./process-summary";
import { StringBuilder } from "@sims/utilities/string-builder";
import { parseJSONError } from "@sims/utilities/parse-json";

/**
 * Common log across entire solution.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  /**
   * Log a friendly error message.
   * @param message friendly message.
   */
  error(message: string): void;
  /**
   * Converts the object into a string and log it.
   * @param object object to be logged.
   */
  error(object: unknown): void;
  /**
   * Log the error message and the error details.
   * @param message friendly message.
   * @param error error captured.
   */
  error(message: string, error: unknown): void;
  /**
   * Log the error message and the error details.
   * @param message friendly message or object to be logged.
   * @param error error captured.
   */
  error(message: unknown, error?: unknown): void {
    const errorBuilder = new StringBuilder();
    if (typeof message === "string") {
      errorBuilder.appendLine(message);
    } else {
      errorBuilder.appendLine(parseJSONError(message));
    }
    if (error) {
      errorBuilder.appendLine(parseJSONError(error));
    }
    super.error(errorBuilder.toString());
  }

  /**
   * Writes all the log entries.
   * @param processSummary process summary logs.
   */
  logProcessSummary(processSummary: ProcessSummary): void {
    for (const logEntry of processSummary.flattenLogs()) {
      switch (logEntry.level) {
        case LogLevels.Error:
          this.error(logEntry.message);
          break;
        case LogLevels.Warn:
          this.warn(logEntry.message);
          break;
        default:
          this.log(logEntry.message);
          break;
      }
    }
  }
}
