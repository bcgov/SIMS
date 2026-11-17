import { Processor } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { BaseQueueProcessor } from "../../base-queue-processor";
import { QueueNames } from "@sims/utilities";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { StudentLoanBalancesProcessingService } from "@sims/integrations/esdc-integration";

/**
 * Process Student Loan Balances file from the SFTP location.
 */
@Processor(
  QueueNames.StudentLoanBalancesPartTimeIntegration,
  BaseQueueProcessor.defaultWorkerOptions,
)
export class StudentLoanBalancesPartTimeIntegrationScheduler extends BaseQueueProcessor<void> {
  constructor(
    private readonly studentLoanBalancesProcessingService: StudentLoanBalancesProcessingService,
    logger: LoggerService,
  ) {
    super(logger);
  }

  /**
   * Process Student Loan Balances files from the SFTP
   * and update the database with processed records.
   * @param job Student Loan Balances job.
   * @param processSummary process summary.
   * @returns processing result.
   */
  protected async processQueue(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    const serviceProcessSummary = new ProcessSummary();
    processSummary.children(serviceProcessSummary);
    await this.studentLoanBalancesProcessingService.processStudentLoanBalances(
      serviceProcessSummary,
    );
    return "Process finalized with success.";
  }
}
