import { IOutputVariables, ZeebeJob } from "@camunda8/sdk/dist/zeebe/types";
import { createFakeWorkerJob } from "../../../../../test/utils/worker-job-mock";
import {
  NotificationPersonalisationContext,
  SendEmailNotificationJobHeaderDTO,
  SendEmailNotificationJobInDTO,
} from "../../notification.dto";
import { EmailNotificationRecipient } from "@sims/services/notifications";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

/**
 * Creates a fake send email notification payload.
 * @param templateId GC Notify template id used to send the email.
 * @param recipientType recipient of the notification.
 * @param options payload options.
 * - `assessmentId` assessment id used to load the notification data.
 * - `personalisation` personalisation context provided by the workflow, mapping
 * each variable name to a path in the notification data.
 * - `metadata` when provided, skips creation if a notification for the same
 * message already exists with matching metadata.
 * @returns fake send email notification payload.
 */
export function createFakeSendEmailNotificationPayload(
  templateId: string,
  recipientType: EmailNotificationRecipient,
  assessmentId: number,
  options?: {
    personalisation?: NotificationPersonalisationContext;
    metadata?: NotificationMetadata;
  },
): Readonly<
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
      assessmentId,
      personalisation: options?.personalisation,
      metadata: options?.metadata,
    },
    customHeaders: {
      templateId,
      recipientType,
    },
  });
}
