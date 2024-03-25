import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { logProcessSummaryToJobLogger } from "../../../utilities";
import { StudentLoanBalancesProcessingService } from "@sims/integrations/esdc-integration";
import { ProcessResponseQueue } from "../esdc-integration/models/esdc.models";
/**
 * Process Student Loan Balances file from the SFTP location.
 */
@Processor(QueueNames.StudentLoanBalances)
export class StudentLoanBalancesIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentLoanBalances)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly studentLoanBalancesProcessingService: StudentLoanBalancesProcessingService,
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process Student Loan Balances files from the SFTP
   * and update the database with processed records.
   * @param job Student Loan Balances job.
   * @returns processing result.
   */
  @Process()
  async processStudentLoanBalancesIntegrationFiles(
    job: Job<void>,
  ): Promise<ProcessResponseQueue[] | string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Processing Student Loan Balances files...");
      const processingResults =
        await this.studentLoanBalancesProcessingService.processStudentLoanBalances();
      processSummary.info("Completed processing Student Loan Balances files.");
      await this.cleanSchedulerQueueHistory();
      return processingResults.map((result) => {
        return {
          processSummary: result.processSummary,
          errorsSummary: result.errorsSummary,
        };
      });
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
      await this.cleanSchedulerQueueHistory();
    }
  }
  @InjectLogger()
  logger: LoggerService;
}
