import { IOutputVariables, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  SendEmailNotificationJobHeaderDTO,
  SendEmailNotificationJobInDTO,
} from "../../notification.dto";
import { WorkflowEmailNotificationRecipient } from "@sims/services/notifications";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

/**
 * Creates a fake send email notification payload.
 * @param options payload options.
 * - `templateId` GC Notify template id used to send the email.
 * - `recipientType` recipient of the notification.
 * - `assessmentId` assessment id used to load the student personal information.
 * - `emailNotificationPersonalisation` personalisation provided by the workflow.
 * - `emailNotificationCheckMetadata` when provided, skips creation if a
 * notification for the same message already exists with matching metadata.
 * @returns fake send email notification payload.
 */
export function createFakeSendEmailNotificationPayload(options: {
  templateId: string;
  recipientType: WorkflowEmailNotificationRecipient;
  assessmentId?: number;
  emailNotificationPersonalisation?: Record<string, string | number | string[]>;
  emailNotificationCheckMetadata?: NotificationMetadata;
}): Readonly<
  ZeebeJob<
    SendEmailNotificationJobInDTO,
    SendEmailNotificationJobHeaderDTO,
    IOutputVariables
  >
> {
  return createFakeWorkerJob<
    SendEmailNotificationJobInDTO,
    SendEmailNotificationJobHeaderDTO,
    IOutputVariables
  >({
    variables: {
      assessmentId: options.assessmentId,
      emailNotificationPersonalisation:
        options.emailNotificationPersonalisation,
      emailNotificationCheckMetadata: options.emailNotificationCheckMetadata,
    },
    customHeaders: {
      templateId: options.templateId,
      recipientType: options.recipientType,
    },
  });
}
