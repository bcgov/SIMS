import { Injectable } from "@nestjs/common";
import { ApplicationService } from "../../";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  NotificationActionsService,
  ProgramSuspensionBlockingApplicationNotification,
} from "@sims/services";
import { NOTIFICATION_MISSING_EMAIL_CONTACTS } from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";

/**
 * Creates a notification for a blocked assessment acceptance due to a program suspension restriction for the ministry.
 */
@Injectable()
export class ProgramSuspensionBlockingAssessmentNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates a program suspension blocking assessment notification for the ministry.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);
    const applications =
      await this.applicationService.getApplicationsBlockedByProgramSuspension();
    if (!applications.length) {
      notificationLog.info(
        "No applications blocked by the program suspension restriction without an existing notification were found.",
      );
      return;
    }
    const notifications =
      applications.map<ProgramSuspensionBlockingApplicationNotification>(
        (application) => ({
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          studentEmail: application.student.user.email,
          birthDate: application.student.birthDate,
          applicationNumber: application.applicationNumber,
          institutionOperatingName:
            application.currentAssessment.offering.institutionLocation
              .institution.operatingName,
          programName:
            application.currentAssessment.offering.educationProgram.name,
          metadata: { assessmentId: application.currentAssessment.id },
        }),
      );
    try {
      await this.notificationActionsService.saveProgramSuspensionBlockingApplicationNotification(
        notifications,
      );
    } catch (error: unknown) {
      // Log process summary warning to create alerts when email contacts are missing for the notification
      // without failing the entire process.
      if (
        error instanceof CustomNamedError &&
        error.name === NOTIFICATION_MISSING_EMAIL_CONTACTS
      ) {
        notificationLog.warn(
          `Program suspension blocking application notification cannot be created: ${error.message}`,
        );
        return;
      }
      throw error;
    }

    notificationLog.info(
      `Program suspension blocking application notifications created for the assessments: ${applications
        .map((application) => application.currentAssessment.id)
        .join(", ")}`,
    );
  }
}
