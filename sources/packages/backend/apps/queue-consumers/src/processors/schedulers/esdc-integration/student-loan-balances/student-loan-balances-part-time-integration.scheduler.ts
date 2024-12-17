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
  protected async process(
    _job: Job<void>,
    processSummary: ProcessSummary,
  ): Promise<string> {
    processSummary.info("Processing Student Loan Balances files.");
    const auditUser = this.systemUsersService.systemUser;
    const serviceProcessSummary = new ProcessSummary();
    processSummary.children(serviceProcessSummary);
    await this.studentLoanBalancesProcessingService.processStudentLoanBalances(
      serviceProcessSummary,
      auditUser.id,
    );
    processSummary.info("Completed processing Student Loan Balances files.");
    return "Process finalized with success.";
  }

  /**
   * Logger for SFAS integration scheduler.
   * Setting the logger here allows the correct context to be set
   * during the property injection.
   * Even if the logger is not used, it is required to be set, to
   * allow the base classes to write logs using the correct context.
   */
  @InjectLogger()
  logger: LoggerService;
}
