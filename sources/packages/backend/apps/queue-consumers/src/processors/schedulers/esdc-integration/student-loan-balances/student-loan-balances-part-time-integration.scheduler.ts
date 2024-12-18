import { InjectQueue, Processor } from "@nestjs/bull";
import { Job, Queue } from "bull";
import { BaseScheduler } from "../../base-scheduler";
import { QueueNames } from "@sims/utilities";
import { QueueService } from "@sims/services/queue";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { StudentLoanBalancesProcessingService } from "@sims/integrations/esdc-integration";

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
  ) {
    super(schedulerQueue, queueService);
  }

  /**
   * Process Student Loan Balances files from the SFTP
   * and update the database with processed records.
   * @param job Student Loan Balances job.
   * @param processSummary process summary.
   * @returns processing result.
   */
  protected async process(
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

  /**
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
