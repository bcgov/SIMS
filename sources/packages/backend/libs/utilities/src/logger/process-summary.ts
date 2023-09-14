import { parseJSONError } from "../parse-json";

/**
 * Allow grouping the log entries indifferent scopes.
 */
export enum LogScopes {
  /**
   * Logs should be displayed at the top as a header
   * providing a summary about the overall process.
   * It can also be used without any 'Combined' errors,
   * providing a more clear separation of the log levels.
   * @example
   * Summary (info)
   * Found 3 records to be processed.
   * All records processed with success.
   * Summary (error)
   * Error while updating table a.
   * The value for the id 999 was not in the expected format.
   */
  Summary = "summary",
  /**
   * All logs levels are displayed in the sequence that they were added.
   */
  Combined = "combined",
}

/**
 * Log entry categories.
 */
export enum LogLevels {
  Info = "info",
  Warn = "warn",
  Error = "error",
}

/**
 * Log entry.
 */
interface LogEntry {
  message: string;
  level: LogLevels;
}

/**
 * Logs grouped by different scopes.
 */
export type ScopedLogLevel = Record<LogScopes, LogEntry[]>;

/**
 * Allow the logs aggregation for a process summary and optionally
 * allow the same logs to be saved to different outputs.
 */
export class ProcessSummary {
  private readonly logs: Record<LogScopes, LogEntry[]>;
  /**
   * Child processes that must be grouped also.
   */
  children: ProcessSummary[] = [];

  /**
   * Creates a new instance of {@link ProcessSummary}.
   * The instance can shared among multiple methods to allow
   * the capture of all log entries that must be grouped.
   */
  constructor() {
    this.logs = {
      [LogScopes.Summary]: [],
      [LogScopes.Combined]: [],
    };
  }

  /**
   * Add some general log for information.
   * @param message log message.
   * @param scope log scoped.
   */
  info(message: string, scope: LogScopes = LogScopes.Combined): void {
    this.logs[scope].push({ message, level: LogLevels.Info });
  }

  /**
   * Add a warning log.
   * @param message log message.
   * @param scope log scoped.
   */
  warn(message: string, scope: LogScopes = LogScopes.Combined): void {
    this.logs[scope].push({ message, level: LogLevels.Warn });
  }

  /**
   * Add a error log.
   * @param message log message.
   * @param error exception to be logged.
   * @param scope log scoped.
   */
  error(
    message: string,
    error: unknown = null,
    scope: LogScopes = LogScopes.Combined,
  ): void {
    const errorDescription = error ? parseJSONError(error) : "";
    const errorMessage = `${message} ${errorDescription}`.trim();
    this.logs[scope].push({ message: errorMessage, level: LogLevels.Error });
  }

  /**
   * Get all log entries as a single list containing
   * all logs and its child processes logs.
   * @returns flattened log entries.
   */
  flattenLogs(): LogEntry[] {
    const logEntries: LogEntry[] = [];
    this.flattenLogsRecursively(this, logEntries);
    return logEntries;
  }

  /**
   * Get all log entries as a single list containing
   * all logs and its child processes logs recursively.
   * @param processSummary process summary to extract the log entries.
   * @param logEntries cumulative log entries.
   */
  private flattenLogsRecursively(
    processSummary: ProcessSummary,
    logEntries: LogEntry[],
  ): void {
    // Summary
    const summary = processSummary.getSummaryPerLogLevel();
    if (summary.length) {
      logEntries.push(...summary);
    }
    // Combined
    const combined = processSummary.logs[LogScopes.Combined];
    if (combined.length) {
      logEntries.push({ message: "Log details", level: LogLevels.Info });
      logEntries.push(...combined);
    }
    if (processSummary.children?.length) {
      for (const childProcessSummary of processSummary.children) {
        this.flattenLogsRecursively(childProcessSummary, logEntries);
      }
    }
  }

  /**
   * Organize the summary scope per log scope.
   * @example
   * Summary (info)
   * Some summary log 1.
   * Some summary log 1.
   * Summary (warn)
   * Some warn log 1.
   * Some warn log 1.
   * Summary (error)
   * Some error log 1.
   * Some error log 1.
   * @returns summary scope per log scope.
   */
  private getSummaryPerLogLevel(): LogEntry[] {
    const logEntries: LogEntry[] = [];
    const summaryLogs = this.logs[LogScopes.Summary];
    if (summaryLogs.length) {
      const logLevels = Object.values(LogLevels);
      for (const logLevel of logLevels) {
        const logsForLevelSummary = summaryLogs.filter(
          (log) => log.level === logLevel,
        );
        if (logsForLevelSummary?.length) {
          logEntries.push({
            message: `Summary for ${logLevel.toUpperCase()} log`,
            level: logLevel,
          });
          for (const log of logsForLevelSummary) {
            logEntries.push(log);
          }
        }
      }
    }
    return logEntries;
  }
}
