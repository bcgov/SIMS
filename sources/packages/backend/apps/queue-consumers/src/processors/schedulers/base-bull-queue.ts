import { CustomNamedError, parseJSONError } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import {
  PROCESS_SUMMARY_CONTAINS_ERROR,
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../utilities";
import { Job } from "bullmq";
import { MetricsService, QueuesMetricsEvents } from "../../services";
import { Inject } from "@nestjs/common";
import { WorkerHost } from "@nestjs/bullmq";

type JobResult = string | string[];

/**
 * Provides basic functionality for queue processing.
 */
export abstract class BaseBullQueue<T> extends WorkerHost {
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
        throw new Error(error.message);
      }
      const errorMessage = `Unexpected error while executing queue ${job.queueName}, job ID ${job.id}.`;
      this.logger.error(errorMessage, error);
      // Throw an error to force the queue to retry. This error will not print the stack trace
      // if using the 'cause' property, hence the stack is added to the message.
      throw new Error(`${errorMessage}${parseJSONError(error)}`);
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
  abstract processQueue(
    job: Job<T, JobResult>,
    processSummary: ProcessSummary,
  ): Promise<JobResult>;
}
