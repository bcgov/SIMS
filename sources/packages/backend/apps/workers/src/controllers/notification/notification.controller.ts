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
  SendEmailNotificationJobHeaderDTO,
  SendEmailNotificationJobInDTO,
} from "..";
import { StudentAssessmentService } from "../../services";
import { createUnexpectedJobFail } from "../../utilities";
import { Workers } from "@sims/services/constants";
import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  EMAIL_NOTIFICATION_CHECK_METADATA,
  EMAIL_NOTIFICATION_PERSONALISATION,
} from "@sims/services/workflow/variables/send-email-notification";
import { MaxJobsToActivate } from "../../types";
import { NotificationActionsService } from "@sims/services";
import { WorkflowEmailNotificationRecipient } from "@sims/services/notifications";
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
  ) {}

  /**
   * Sends a generic email notification triggered by a workflow. The GC Notify
   * template is resolved (or created) from the provided template id, so new
   * notifications can be sent without code or migration changes. The recipient
   * can be either the student or the Ministry:
   */
  @ZeebeWorker(Workers.SendEmailNotification, {
    fetchVariable: [
      ASSESSMENT_ID,
      EMAIL_NOTIFICATION_PERSONALISATION,
      EMAIL_NOTIFICATION_CHECK_METADATA,
    ],
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
      emailNotificationPersonalisation,
      emailNotificationCheckMetadata,
    } = job.variables;
    try {
      await this.dataSource.transaction(async (entityManager) => {
        switch (recipientType) {
          case WorkflowEmailNotificationRecipient.Student: {
            const student =
              await this.studentAssessmentService.getStudentDetailsForNotificationByAssessmentId(
                assessmentId,
                entityManager,
              );
            if (!student) {
              throw new Error(
                `Student not found for the assessment id ${assessmentId}.`,
              );
            }
            await this.notificationActionsService.saveWorkflowStudentEmailNotification(
              {
                templateId,
                personalisation: emailNotificationPersonalisation,
                student,
              },
              entityManager,
              { checkMetadata: emailNotificationCheckMetadata },
            );
            break;
          }
          case WorkflowEmailNotificationRecipient.Ministry:
            await this.notificationActionsService.saveWorkflowMinistryEmailNotification(
              {
                templateId,
                personalisation: emailNotificationPersonalisation,
              },
              entityManager,
            );
            break;
          default:
            throw new Error(
              `Unsupported notification recipient type: ${recipientType}.`,
            );
        }
      });
      jobLogger.log("Workflow email notification created.");
      return job.complete();
    } catch (error: unknown) {
      return createUnexpectedJobFail(error, job, { logger: jobLogger });
    }
  }
}
