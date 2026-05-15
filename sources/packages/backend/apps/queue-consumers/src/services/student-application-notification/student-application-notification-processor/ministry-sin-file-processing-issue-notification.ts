import { Injectable } from "@nestjs/common";
import {
  FileProcessingIssueType,
  MinistryFileProcessingIssueNotification,
  NotificationActionsService,
} from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { InjectRepository } from "@nestjs/typeorm";
import { SINValidation } from "@sims/sims-db";
import { Repository } from "typeorm";
import { ConfigService } from "@sims/utilities/config";

/**
 * Creates a ministry email notification for overdue SIN file processing issues.
 */
@Injectable()
export class MinistrySINFileProcessingIssueNotification {
  constructor(
    @InjectRepository(SINValidation)
    private readonly sinValidationRepo: Repository<SINValidation>,
    private readonly configService: ConfigService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a ministry notification for overdue SIN file processing issues.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);

    const overdueSINNotifications = await this.findOverdueSINValidations();

    if (!overdueSINNotifications.length) {
      notificationLog.info(
        `No SIN validations ${this.configService.sinFileOverdueDays} days past due found to generate notifications.`,
      );
      return;
    }

    const notifications =
      overdueSINNotifications.map<MinistryFileProcessingIssueNotification>(
        (sinNotification) => ({
          fileName: sinNotification.fileSent!,
          dateSent: sinNotification.dateSent!,
          type: FileProcessingIssueType.SIN,
        }),
      );

    await this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
      notifications,
    );

    notificationLog.info(
      `Total overdue SIN validations that generated notifications: ${notifications.length}`,
    );
  }

  private async findOverdueSINValidations(): Promise<SINValidation[]> {
    return await this.sinValidationRepo
      .createQueryBuilder("sinValidation")
      .select(["sinValidation.dateSent", "sinValidation.fileSent"])
      .distinctOn(["sinValidation.dateSent", "sinValidation.fileSent"])
      .where(
        `sinValidation.dateSent < NOW() - INTERVAL '${this.configService.sinFileOverdueDays} day'`,
      )
      .andWhere("sinValidation.dateReceived IS NULL")
      .getMany();
  }
}
