import { InjectQueue, Process, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  getSuccessMessageWithAttentionCheck,
  logProcessSummaryToJobLogger,
} from "../../../../utilities";
import { StudentLoanBalancesProcessingService } from "@sims/integrations/esdc-integration";
import { SystemUsersService } from "@sims/services";

/**
 * Process Student Loan Balances file from the SFTP location.
 */
@Processor(QueueNames.StudentLoanBalancesPartTimeIntegration)
export class StudentLoanBalancesPartTimeIntegrationScheduler extends BaseScheduler<void> {
  constructor(
    @InjectQueue(QueueNames.StudentLoanBalancesPartTimeIntegration)
    schedulerQueue: Queue<void>,
    queueService: QueueService,
    private readonly studentLoanBalancesProcessingService: StudentLoanBalancesProcessingService,
    private readonly systemUsersService: SystemUsersService,
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
  async processStudentLoanBalancesFiles(job: Job<void>): Promise<string[]> {
    const processSummary = new ProcessSummary();
    try {
      processSummary.info("Processing Student Loan Balances files.");
      const auditUser = this.systemUsersService.systemUser;
      const serviceProcessSummary = new ProcessSummary();
      processSummary.children(serviceProcessSummary);
      await this.studentLoanBalancesProcessingService.processStudentLoanBalances(
        serviceProcessSummary,
        auditUser.id,
      );
      processSummary.info("Completed processing Student Loan Balances files.");
      return getSuccessMessageWithAttentionCheck(
        ["Process finalized with success."],
        processSummary,
      );
    } catch (error: unknown) {
      const errorMessage = "Unexpected error while executing the job.";
      processSummary.error(errorMessage, error);
      return [errorMessage];
    } finally {
      this.logger.logProcessSummary(processSummary);
      await logProcessSummaryToJobLogger(processSummary, job);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
