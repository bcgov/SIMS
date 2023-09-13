import { Injectable, ConsoleLogger, Scope } from "@nestjs/common";
import { LogLevels, ProcessSummary } from "./process-summary";

/**
 * Common log across entire solution.
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
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
