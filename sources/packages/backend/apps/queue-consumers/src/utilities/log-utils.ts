import { CustomNamedError } from "@sims/utilities";
import { ProcessSummary } from "@sims/utilities/logger";
import * as dayjs from "dayjs";

/**
 * Used for log indentation to create a hierarchy
 * for log children at different levels.
 */
const LOG_INDENTATION = "--";

export const PROCESS_SUMMARY_CONTAINS_ERROR = "PROCESS_SUMMARY_CONTAINS_ERROR";

/**
 * Log capability provided by a queue job.
 */
export interface JobLogger {
  log(message: string): Promise<void>;
}

/**
 * Writes all the log entries to job logger.
 * @param processSummary process summary logs.
 * @param logger optionally provides a job logger 3r
 * in case one is not present.
 */
export async function logProcessSummaryToJobLogger(
  processSummary: ProcessSummary,
  logger: JobLogger,
): Promise<void> {
  for (const logEntry of processSummary.flattenLogs()) {
    const logIndentation = LOG_INDENTATION.repeat(logEntry.indentationLevel);
    const dateTimeEntry = dayjs(logEntry.date).format("YYYY-MM-DD HH:mm:ss");
    await logger.log(
      `[${dateTimeEntry}]${logIndentation}${logEntry.level.toUpperCase()}: ${
        logEntry.message
      }`,
    );
  }
}

/**
 * Takes a regular success messages and append possible
 * attention messages if there are errors or warnings.
 * @param successMessages generic success message.
 * @param processSummary processSummary to check if an
 * attention message is required.
 * @param options options.
 * - `throwOnError`: when true, throws an exception if the
 * error summary contains some error.
 * @returns generic success message or success message with
 * attention messages appended.
 */
export function getSuccessMessageWithAttentionCheck(
  successMessages: string[],
  processSummary: ProcessSummary,
  options?: { throwOnError?: boolean },
): string[] {
  const throwOnError = options.throwOnError ?? false;
  const message: string[] = [];
  message.push(...successMessages);
  const logsSum = processSummary.getLogLevelSum();
  if (logsSum.error || logsSum.warn) {
    message.push(
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
    );
    message.push(
      `Error(s): ${logsSum.error}, Warning(s): ${logsSum.warn}, Info: ${logsSum.info}`,
    );
    if (logsSum.error && throwOnError) {
      throw new CustomNamedError(
        "One or more errors were reported during the process, please see logs for details.",
        PROCESS_SUMMARY_CONTAINS_ERROR,
      );
    }
  }
  return message;
}
