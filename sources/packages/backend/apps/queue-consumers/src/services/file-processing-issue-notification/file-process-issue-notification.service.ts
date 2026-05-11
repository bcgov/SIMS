import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationActionsService } from "@sims/services/notifications/notification/notification-actions.service";
import { MinistryFileProcessingIssueNotification } from "@sims/services/notifications/notification/notification.model";
import { CRAIncomeVerification, SINValidation } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { IsNull, LessThan, Repository } from "typeorm";

@Injectable()
export class FileProcessingIssueNotificationService {
  constructor(
    @InjectRepository(CRAIncomeVerification)
    private readonly craIncomeVerificationRepo: Repository<CRAIncomeVerification>,
    @InjectRepository(SINValidation)
    private readonly sinValidationRepo: Repository<SINValidation>,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  // CRA/SIN responses are typically 1-2 business days.
  // To account for weekends and stat holidays, we'll set this to 5 calendar days.
  OVERDUE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  async notifyFileProcessingIssues(
    processSummary: ProcessSummary,
  ): Promise<void> {
    const craPromise = this.findOverdueCRAIncomeVerifications();
    const sinPromise = this.findOverdueSINValidations();

    const [craNotifications, sinNotifications] = await Promise.all([
      craPromise,
      sinPromise,
    ]);

    processSummary.info(
      `Total overdue CRA income verifications: ${craNotifications.length}`,
    );
    processSummary.info(
      `Total overdue SIN validations: ${sinNotifications.length}`,
    );

    await this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
      [...craNotifications, ...sinNotifications],
    );
  }

  private async findOverdueCRAIncomeVerifications(): Promise<
    MinistryFileProcessingIssueNotification[]
  > {
    const incomeVerifications: CRAIncomeVerification[] =
      await this.craIncomeVerificationRepo.find({
        select: {
          dateSent: true,
          fileSent: true,
        },
        where: {
          dateReceived: IsNull(),
          dateSent: LessThan(new Date(Date.now() - this.OVERDUE_DAYS_MS)),
        },
      });

    return incomeVerifications.map((response) => ({
      title: "TBD",
      fileName: response.fileSent!,
      dateSent: response.dateSent!,
      type: "CRA",
    }));
  }

  private async findOverdueSINValidations(): Promise<
    MinistryFileProcessingIssueNotification[]
  > {
    const sinValidations: SINValidation[] = await this.sinValidationRepo.find({
      select: {
        dateSent: true,
        fileSent: true,
      },
      where: {
        dateReceived: IsNull(),
        dateSent: LessThan(new Date(Date.now() - this.OVERDUE_DAYS_MS)),
      },
    });

    return sinValidations.map((response) => ({
      title: "TBD",
      fileName: response.fileSent!,
      dateSent: response.dateSent!,
      type: "SIN",
    }));
  }
}
