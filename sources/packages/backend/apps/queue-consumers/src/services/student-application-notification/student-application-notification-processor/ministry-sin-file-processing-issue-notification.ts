import { Injectable } from "@nestjs/common";
import {
  FileProcessingIssueType,
  MinistryFileProcessingIssueNotification,
  NotificationActionsService,
} from "@sims/services";
import { ProcessSummary } from "@sims/utilities/logger";
import { InjectRepository } from "@nestjs/typeorm";
import { Student } from "@sims/sims-db";
import { Repository } from "typeorm";
import { ConfigService } from "@sims/utilities/config";

/**
 * Creates a ministry email notification for overdue SIN file processing issues.
 */
@Injectable()
export class MinistrySINFileProcessingIssueNotification {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
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

    const studentsWithOverdueSINValidations = await this.studentRepo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "sinValidation.dateSent",
        "sinValidation.fileSent",
      ])
      .innerJoin("student.sinValidation", "sinValidation")
      .distinctOn(["sinValidation.fileSent"])
      .where(
        "sinValidation.dateSent < NOW() - (:fileOverdueDays * INTERVAL '1 day')",
        { fileOverdueDays: this.configService.esdcIntegration.fileOverdueDays },
      )
      .andWhere("sinValidation.dateReceived IS NULL")
      .getMany();

    if (!studentsWithOverdueSINValidations.length) {
      notificationLog.info(
        `No SIN validations ${this.configService.esdcIntegration.fileOverdueDays} days past due found to generate notifications.`,
      );
      return;
    }

    const notifications =
      studentsWithOverdueSINValidations.map<MinistryFileProcessingIssueNotification>(
        (student) => ({
          fileName: student.sinValidation.fileSent!,
          dateSent: student.sinValidation.dateSent!,
          type: FileProcessingIssueType.SIN,
        }),
      );

    await this.notificationActionsService.saveMinistryFileProcessingIssueNotification(
      notifications,
    );

    notificationLog.info(
      `Overdue SIN validations that generated notifications: ${notifications.map((notification) => notification.fileName).join(", ")}.`,
    );
  }
}
