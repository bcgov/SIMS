import { Injectable } from "@nestjs/common";
import { ApplicationService } from "../..";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  InstitutionRestrictionBlockingApplicationNotification,
  NotificationActionsService,
} from "@sims/services";
import { NOTIFICATION_MISSING_EMAIL_CONTACTS } from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";

/**
 * Creates a notification for a blocked assessment acceptance due to institution restrictions for the ministry.
 */
@Injectable()
export class InstitutionRestrictionsBlockingAssessmentNotification {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {}

  /**
   * Creates institution restriction blocking assessment notifications for the ministry.
   * @param processSummary process summary for logging.
   */
  async createNotification(processSummary: ProcessSummary): Promise<void> {
    const notificationLog = new ProcessSummary();
    processSummary.children(notificationLog);
    const applications =
      await this.applicationService.getApplicationsBlockedByInstitutionRestrictions();
    if (!applications.size) {
      notificationLog.info(
        "No applications blocked by institution restrictions without an existing notification were found.",
      );
      return;
    }
    const notifications: InstitutionRestrictionBlockingApplicationNotification[] =
      [];
    for (const [, { application, restrictionCodes }] of applications.entries()) {
      for (const restrictionCode of restrictionCodes) {
        notifications.push({
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          studentEmail: application.student.user.email,
          birthDate: application.student.birthDate,
          applicationNumber: application.applicationNumber,
          institutionOperatingName:
            application.currentAssessment.offering.institutionLocation.institution
              .operatingName,
          locationName:
            application.currentAssessment.offering.institutionLocation.name,
          programName:
            application.currentAssessment.offering.educationProgram.name,
          metadata: {
            assessmentId: application.currentAssessment.id,
            restrictionCode,
          },
        });
      }
    }
    try {
      await this.notificationActionsService.saveInstitutionRestrictionBlockingApplicationNotification(
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
          `Institution restriction blocking application notification cannot be created: ${error.message}`,
        );
        return;
      }
      throw error;
    }

    notificationLog.info(
      `Institution restriction blocking application notifications created for the assessments: ${Array.from(
        applications.values(),
      )
        .map((data) => data.application.currentAssessment.id)
        .join(", ")}`,
    );
  }
}
