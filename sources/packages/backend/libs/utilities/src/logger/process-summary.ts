import { CustomNamedError } from "../custom-named-error";
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
class LogEntry {
  constructor(
    public message: string,
    public level: LogLevels,
    public indentationLevel = 0,
  ) {}
  date = new Date();
}

/**
 * Logs grouped by different scopes.
 */
export type ScopedLogLevel = Record<LogScopes, LogEntry[]>;

/**
 * Allows a log entry that represents either a single log
 * or a new collection of child entries.
 */
type LogInfoEntry = LogEntry | ProcessSummary[];

/**
 * Allow the logs aggregation for a process summary and optionally
 * allow the same logs to be saved to different outputs.
 */
export class ProcessSummary {
  private readonly logs: Record<LogScopes, LogInfoEntry[]>;

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
    this.logs[scope].push(new LogEntry(message, LogLevels.Info));
  }

  /**
   * Add a warning log.
   * @param message log message.
   * @param scope log scoped.
   */
  warn(message: string, scope: LogScopes = LogScopes.Combined): void {
    this.logs[scope].push(new LogEntry(message, LogLevels.Warn));
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
    let errorDescription = "";
    // Considering that logging the stack trace is not useful for custom-named errors and only message is sufficient,
    // the custom-named errors are identified and custom error message is added to the process summary.
    // For any other runtime error, logging the stack trace is considered as essential.
    if (error) {
      errorDescription =
        error instanceof CustomNamedError
          ? error.message
          : parseJSONError(error);
    }
    const errorMessage = `${message} ${errorDescription}`.trim();
    this.logs[scope].push(new LogEntry(errorMessage, LogLevels.Error));
  }

  /**
   * Appends a collection o children logs (or a single one)
   * to the list of combined log entries.
   * @param children children (or child) to be appended.
   */
  children(...children: ProcessSummary[]) {
    this.logs[LogScopes.Combined].push(children);
  }

  /**
   * Get all log entries as a single list containing
   * all logs and its child processes logs.
   * @returns flattened log entries.
   */
  flattenLogs(): LogEntry[] {
    const logEntries: LogEntry[] = [];
    this.flattenLogsRecursively(this, logEntries, 0);
    return logEntries;
  }

  /**
   * Count and create a summary of all the log levers
   * entries presents in this process summary.
   * @returns sum of entries grouped by log level.
   */
  getLogLevelSum(): Record<LogLevels, number> {
    const result = {
      [LogLevels.Info]: 0,
      [LogLevels.Warn]: 0,
      [LogLevels.Error]: 0,
    };
    const logs = this.flattenLogs();
    logs.forEach((log) => {
      result[log.level]++;
    });
    return result;
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
    indentationLevel: number,
  ): void {
    // Summary
    const summary = processSummary.getSummaryPerLogLevel();
    if (summary.length) {
      summary.forEach((entry) => {
        entry.indentationLevel = indentationLevel;
      });
      logEntries.push(...summary);
    }
    // Combined
    const combined = processSummary.logs[LogScopes.Combined];
    if (combined.length) {
      logEntries.push(
        new LogEntry("Log details", LogLevels.Info, indentationLevel),
      );
      for (const logInfoEntry of combined) {
        if (logInfoEntry instanceof LogEntry) {
          logInfoEntry.indentationLevel = indentationLevel;
          logEntries.push(logInfoEntry);
          continue;
        }
        if (logInfoEntry?.length) {
          for (const childProcessSummary of logInfoEntry) {
            this.flattenLogsRecursively(
              childProcessSummary,
              logEntries,
              indentationLevel + 1,
            );
          }
        }
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
          (log: LogEntry) => log.level === logLevel,
        );
        if (logsForLevelSummary?.length) {
          logEntries.push(
            new LogEntry(`Summary for ${logLevel.toUpperCase()} log`, logLevel),
          );
          for (const log of logsForLevelSummary) {
            logEntries.push(log as LogEntry);
          }
        }
      }
    }
    return logEntries;
  }
}
