import { ProcessSummary } from "@sims/utilities/logger";
import * as dayjs from "dayjs";

/**
 * Used for log indentation to create a hierarchy
 * for log children at different levels.
 */
const LOG_INDENTATION = "--";

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
 * @returns generic success message or success message with
 * attention messages appended.
 */
export function getSuccessMessageWithAttentionCheck(
  successMessages: string[],
  processSummary: ProcessSummary,
): string[] {
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
  }
  return message;
}
