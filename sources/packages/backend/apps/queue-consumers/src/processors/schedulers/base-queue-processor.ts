import { CustomNamedError, parseJSONError } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import {
  PROCESS_SUMMARY_CONTAINS_ERROR,
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../utilities";
import { Job, UnrecoverableError, WorkerOptions } from "bullmq";
import { MetricsService, QueuesMetricsEvents } from "../../services";
import { Inject } from "@nestjs/common";
import { WorkerHost } from "@nestjs/bullmq";
import { FILE_NOT_FOUND, EMPTY_FILE } from "../../constants";

type JobResult = string | string[];
const PERMANENT_FAILURE_ERROR_NAMES = [FILE_NOT_FOUND, EMPTY_FILE];

/**
 * Base class for queue processors providing common functionality and error handling.
 */
export abstract class BaseQueueProcessor<T> extends WorkerHost {
  constructor(protected readonly logger: LoggerService) {
    super();
  }
  /**
   * Metrics service to allow incrementing job events.
   */
  @Inject(MetricsService)
  private readonly metricsService: MetricsService;

  /**
   * Wrap the queue job execution in a try/catch for the global error handling.
   * It provides also the default {@link ProcessSummary} for logging.
   * @param job process job.
   * @returns processing result.
   */
  async process(job: Job<T, JobResult>): Promise<JobResult> {
    const processSummary = new ProcessSummary((progress: number) => {
      return job.updateProgress(progress);
    });
    try {
      // Log the start of the process for the summary and logger.
      const startLogMessage = `Processing queue ${job.queueName}, job ID ${job.id}.`;
      processSummary.info(startLogMessage);
      this.logger.log(startLogMessage);
      // Execute the process.
      const result = await this.processQueue(job, processSummary);
      // Log the end of the process for the summary and logger.
      const endLogMessage = `${job.queueName}, job ID ${job.id}, finished.`;
      processSummary.info(endLogMessage);
      this.logger.log(endLogMessage);
      const logsSum = processSummary.getLogLevelSum();
      if (logsSum.warn) {
        this.metricsService.incrementJobEventCounter(
          {
            queueName: job.queueName,
            isScheduler: !!job.repeatJobKey,
          },
          QueuesMetricsEvents.JobFinalizedWithWarnings,
          { incrementValue: logsSum.warn },
        );
      }
      if (logsSum.error) {
        throw new CustomNamedError(
          "One or more errors were reported during the process, please see logs for details.",
          PROCESS_SUMMARY_CONTAINS_ERROR,
        );
      }
      return getSuccessMessageWithAttentionCheck(result, processSummary);
    } catch (error: unknown) {
      // Throw an error to force the queue to retry.
      if (error instanceof CustomNamedError) {
        const errorMessage = error.message;
        // Throw an UnrecoverableError for permanent failure error names.
        // The job will not be retried for UnrecoverableError.
        if (PERMANENT_FAILURE_ERROR_NAMES.includes(error.name)) {
          this.logger.error(`Permanent failure error: ${errorMessage}`);
          throw new UnrecoverableError(error.message);
        }
        this.logger.error(error);
        throw error;
      }
      const errorMessage = `Unexpected error while executing queue ${job.queueName}, job ID ${job.id}.`;
      this.logger.error(errorMessage, error);
      // Throw an error to force the queue to retry. This error will not print the stack trace
      // if using the 'cause' property, hence the stack is added to the message.
      throw new Error(`${errorMessage}${parseJSONError(error)}`, {
        cause: error,
      });
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
  }

  /**
   * When implemented in a derived class, process the queue job
   * wrapped in a try/catch for the global error handling.
   * It provides also the default {@link ProcessSummary} for logging.
   * @param job process job.
   * @param processSummary process summary for logging.
   * @returns processing result.
   */
  protected abstract processQueue(
    job: Job<T, JobResult>,
    processSummary: ProcessSummary,
  ): Promise<JobResult>;

  /**
   * Default worker options for the queue processor.
   */
  static readonly defaultWorkerOptions: Partial<WorkerOptions> = {
    lockDuration: 6000,
    lockRenewTime: 5000,
    maxStalledCount: 0,
  };
}
