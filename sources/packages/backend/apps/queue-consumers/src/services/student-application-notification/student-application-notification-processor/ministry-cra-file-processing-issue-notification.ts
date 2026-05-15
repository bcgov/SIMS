import { Injectable } from "@nestjs/common";
import {
  FileProcessingIssueType,
  MinistryFileProcessingIssueNotification,
  NotificationActionsService,
} from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { InjectRepository } from "@nestjs/typeorm";
import { CRAIncomeVerification } from "@sims/sims-db";
import { Repository } from "typeorm";
import { ConfigService } from "@sims/utilities/config";

/**
 * Creates a ministry email notification for overdue CRA file processing issues.
 */
@Injectable()
export class MinistryCRAFileProcessingIssueNotification {
  constructor(
    @InjectRepository(CRAIncomeVerification)
    private readonly craIncomeVerificationRepo: Repository<CRAIncomeVerification>,
    private readonly configService: ConfigService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a ministry notification for overdue CRA file processing issues.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const overdueCRANotifications = await this.craIncomeVerificationRepo
      .createQueryBuilder("craIncomeVerification")
      .select([
        "craIncomeVerification.dateSent",
        "craIncomeVerification.fileSent",
      ])
      .distinctOn(["craIncomeVerification.fileSent"])
      .where(
        `craIncomeVerification.dateSent < NOW() - INTERVAL '${this.configService.craFileOverdueDays} day'`,
      )
      .andWhere("craIncomeVerification.dateReceived IS NULL")
      .getMany();

    if (!overdueCRANotifications.length) {
      notificationLog.info(
        `No CRA income verifications ${this.configService.craFileOverdueDays} days past due found to generate notifications.`,
      );
      return;
    }

    const notifications =
      overdueCRANotifications.map<MinistryFileProcessingIssueNotification>(
        (craNotification) => ({
          fileName: craNotification.fileSent!,
          dateSent: craNotification.dateSent!,
          type: FileProcessingIssueType.CRA,
        }),
      );

    await this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
      notifications,
    );

    notificationLog.info(
      `Total overdue CRA income verifications that generated notifications: ${notifications.length}`,
    );
  }
}
