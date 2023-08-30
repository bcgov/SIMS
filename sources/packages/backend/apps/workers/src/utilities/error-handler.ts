import { Logger } from "@nestjs/common";
import { ZeebeJob, MustReturnJobActionAcknowledgement } from "zeebe-node";

/**
 * Takes care of log and will acknowledge worker,
 * in case any unexpected job failure.
 * @param error error message to be logged.
 * @param job zeebe job.
 * @param logger logger object if any,
 * else a new logger instance will be created.
 * @returns a job fail acknowledgement to the worker.
 */
export function createUnexpectedJobFail(
  error: unknown,
  job: ZeebeJob,
  logger?: Logger,
): MustReturnJobActionAcknowledgement {
  const jobLogger = logger ?? new Logger(job.type);
  const errorMessage = `Unexpected error while processing job. ${parseException(
    error,
  )}`;
  jobLogger.error(job);
  jobLogger.error(errorMessage);
  return job.fail(errorMessage);
}

/**
 * Parse the error in a prettier format for better
 * readability.
 */
function parseException(error: unknown): string {
  return JSON.stringify(error, null, 2);
}
