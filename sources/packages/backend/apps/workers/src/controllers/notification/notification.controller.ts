/**
 * Workers must be implemented as idempotent methods and also with the ability to allow a retry operation.
 * The idempotency would ensure the worker can be potentially be called multiple time to process the same job
 * and it will produce the same impact and same result. To know more about it please check the link
 * https://docs.camunda.io/docs/components/best-practices/development/dealing-with-problems-and-exceptions/#writing-idempotent-workers.
 * The retry ability means that, in case of fail, the worker must ensure the data would still be consistent
 * and a new retry operation would be successfully executed.
 * Please see the below link also for some best practices for workers.
 * https://docs.camunda.io/docs/components/best-practices/development/dealing-with-problems-and-exceptions/
 */
import { Controller, Logger } from "@nestjs/common";
import { ZeebeWorker } from "../../zeebe";
import {
  NotificationPersonalisationContext,
  NotificationPersonalisationData,
  SendEmailNotificationJobHeaderDTO,
  SendEmailNotificationJobInDTO,
} from "..";
import { StudentAssessmentService } from "../../services";
import { createUnexpectedJobFail } from "../../utilities";
import {
  Workers,
  ASSESSMENT_NOT_FOUND,
  NOTIFICATION_MISSING_EMAIL_CONTACTS,
  UNSUPPORTED_NOTIFICATION_RECIPIENT_TYPE,
} from "@sims/services/constants";
import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  METADATA,
  PERSONALISATION,
} from "@sims/services/workflow/variables/send-email-notification";
import { MaxJobsToActivate } from "../../types";
import { NotificationActionsService } from "@sims/services";
import {
  EmailNotificationRecipient,
  NotificationMessageService,
} from "@sims/services/notifications";
import { StudentAssessment } from "@sims/sims-db";
import { DataSource } from "typeorm";
import {
  IOutputVariables,
  MustReturnJobActionAcknowledgement,
  ZeebeJob,
} from "@camunda8/sdk/dist/zeebe/types";

@Controller()
export class NotificationController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly notificationMessageService: NotificationMessageService,
  ) {}

  /**
   * Sends a generic email notification triggered by a workflow. The notification
   * data is loaded generically from the assessment and used both to resolve the
   * personalisation referenced by the workflow and to address the notification
   * according to the recipient type.
   * @param job Zeebe job that contains the notification details and headers.
   * @returns Zeebe job acknowledgement.
   */
  @ZeebeWorker(Workers.SendEmailNotification, {
    fetchVariable: [ASSESSMENT_ID, PERSONALISATION, METADATA],
    maxJobsToActivate: MaxJobsToActivate.Normal,
  })
  async sendEmailNotification(
    job: Readonly<
      ZeebeJob<
        SendEmailNotificationJobInDTO,
        SendEmailNotificationJobHeaderDTO,
        IOutputVariables
      >
    >,
  ): Promise<MustReturnJobActionAcknowledgement> {
    const jobLogger = new Logger(job.type);
    const { templateId, recipientType } = job.customHeaders;
    const {
      assessmentId,
      personalisation: personalisationContext,
      metadata,
    } = job.variables;
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        // A pessimistic write lock is acquired on the assessment as soon as the
        // job starts processing, serializing concurrent executions of the same
        // job for the same assessment. This keeps the worker idempotent: even if
        // it runs more than once, the duplicate check performed before saving
        // the notification stays reliable and a single email is created. The lock
        // is a requirement of this consumer, not of the service loading the data.
        const lockedAssessment =
          await this.studentAssessmentService.acquireAssessmentLock(
            assessmentId,
            entityManager,
          );
        if (!lockedAssessment) {
          const message = `Assessment id ${assessmentId} not found.`;
          jobLogger.error(message);
          return job.error(ASSESSMENT_NOT_FOUND, message);
        }
        // Load the notification data to resolve the personalisation.
        const assessment =
          await this.studentAssessmentService.getAssessmentNotificationDetails(
            assessmentId,
            entityManager,
          );
        const notificationData =
          this.buildNotificationPersonalisationData(assessment);
        const personalisation = this.resolvePersonalisation(
          personalisationContext,
          notificationData,
        );

        const notificationMessage =
          await this.notificationMessageService.getNotificationMessageByTemplateId(
            templateId,
            { entityManager },
          );

        if (!notificationMessage) {
          throw new Error(
            `Notification message not found for template id ${templateId}`,
          );
        }

        switch (recipientType) {
          case EmailNotificationRecipient.Student:
            await this.notificationActionsService.saveEmailNotification(
              {
                userId: notificationData.studentUserId,
                emailRecipients: [notificationData.studentEmail],
                personalisation,
              },
              notificationMessage,
              entityManager,
              { metadata },
            );
            break;
          case EmailNotificationRecipient.Ministry:
            if (!notificationMessage.emailContacts?.length) {
              const errorMessage = `No email contacts are configured for the Ministry notification with template ${templateId}.`;
              jobLogger.error(errorMessage);
              return job.error(
                NOTIFICATION_MISSING_EMAIL_CONTACTS,
                errorMessage,
              );
            }

            await this.notificationActionsService.saveEmailNotification(
              {
                emailRecipients: notificationMessage.emailContacts,
                personalisation,
              },
              notificationMessage,
              entityManager,
            );
            break;
          default: {
            const errorMessage = `Unsupported notification recipient type: ${recipientType}.`;
            jobLogger.error(errorMessage);
            return job.error(
              UNSUPPORTED_NOTIFICATION_RECIPIENT_TYPE,
              errorMessage,
            );
          }
        }
        jobLogger.log("Workflow email notification created.");
        return job.complete();
      });
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, { logger: jobLogger });
    }
  }

  /**
   * Builds the notification data used as the source of the values referenced by
   * the personalisation context provided by the workflow.
   * @param assessment assessment with the associated student details.
   * @returns notification data resolved from the assessment.
   */
  private buildNotificationPersonalisationData(
    assessment: StudentAssessment,
  ): NotificationPersonalisationData {
    const { student } = assessment.application;
    return {
      studentUserId: student.user.id,
      studentEmail: student.user.email,
      studentGivenNames: student.user.firstName ?? "",
      studentLastName: student.user.lastName,
      applicationNumber: assessment.application.applicationNumber,
    };
  }

  /**
   * Resolves the personalisation values sent to GC Notify from the personalisation
   * context provided by the workflow, mapping each variable name to the
   * corresponding value in the notification data.
   * @param personalisationContext personalisation context provided by the
   * workflow, mapping each variable name to a path in the notification data.
   * @param notificationData notification data resolved on the API side.
   * @returns personalisation values to be sent to GC Notify, or undefined when
   * no personalisation context is provided, letting the notification action
   * service decide the fallback.
   */
  private resolvePersonalisation(
    personalisationContext: NotificationPersonalisationContext | undefined,
    notificationData: NotificationPersonalisationData,
  ): Record<string, string | number | string[]> | undefined {
    if (!personalisationContext) {
      return undefined;
    }
    const personalisation: Record<string, string | number | string[]> = {};
    for (const [variableName, path] of Object.entries(personalisationContext)) {
      personalisation[variableName] =
        notificationData[path as keyof NotificationPersonalisationData];
    }
    return personalisation;
  }
}
