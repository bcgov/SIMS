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

    const overdueCRAVerifications = await this.craIncomeVerificationRepo
      .createQueryBuilder("craIncomeVerification")
      .select([
        "craIncomeVerification.dateSent",
        "craIncomeVerification.fileSent",
      ])
      .distinctOn(["craIncomeVerification.fileSent"])
      .where(
        "craIncomeVerification.dateSent < NOW() - (:fileOverdueDays * INTERVAL '1 day')",
        {
          fileOverdueDays: this.configService.craIntegration.fileOverdueDays,
        },
      )
      .andWhere("craIncomeVerification.dateReceived IS NULL")
      .getMany();

    if (!overdueCRAVerifications.length) {
      notificationLog.info(
        `No CRA income verifications ${this.configService.craIntegration.fileOverdueDays} days past due found to generate notifications.`,
      );
      return;
    }

    const notifications =
      overdueCRAVerifications.map<MinistryFileProcessingIssueNotification>(
        (craVerification) => ({
          fileName: craVerification.fileSent!,
          dateSent: craVerification.dateSent!,
          type: FileProcessingIssueType.CRA,
        }),
      );

    await this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
      notifications,
    );

    notificationLog.info(
      `Overdue CRA income verifications that generated notifications: ${notifications.map((notification) => notification.fileName).join(", ")}.`,
    );
  }
}
