import {
  ICustomHeaders,
  IInputVariables,
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";
import { Logger } from "@nestjs/common";
import { parseJSONError } from "@sims/utilities";

/**
 * Takes care of log and will acknowledge worker,
 * in case any unexpected job failure.
 * @param error error message to be logged.
 * @param job zeebe job.
 * @param options options,
 * - "logger" logger object if any,
 * else a new logger instance will be created.
 * @returns a job fail acknowledgement to the worker.
 */
export function createUnexpectedJobFail(
  error: unknown,
  job: ZeebeJob<unknown, unknown, unknown>,
  options?: {
    logger?: Logger;
  },
): MustReturnJobActionAcknowledgement {
  const jobLogger = options?.logger ?? new Logger(job.type);
  const errorMessage = `Unexpected error while processing job. ${parseJSONError(
    error,
  )}`;
  jobLogger.error(job);
  jobLogger.error(errorMessage);
  return job.fail(errorMessage);
}
