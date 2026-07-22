import { WorkflowEmailNotificationRecipient } from "@sims/services/notifications";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

/**
 * Variables required by the send email notification worker.
 */
export interface SendEmailNotificationJobInDTO {
  /**
   * Assessment id used to load the student personal information when the
   * recipient of the notification is the student.
   */
  assessmentId?: number;
  /**
   * Free-form personalisation values provided by the workflow to be merged with
   * the personal information loaded on the API side before the email is sent.
   */
  emailNotificationPersonalisation?: Record<string, string | number | string[]>;
  /**
   * Free-form metadata provided by the workflow used to check whether the same
   * notification was already sent, preventing duplicate emails. When provided,
   * the notification is created only if no notification for the same message
   * already exists with matching metadata.
   */
  emailNotificationCheckMetadata?: NotificationMetadata;
}

/**
 * Headers required by the send email notification worker.
 */
export interface SendEmailNotificationJobHeaderDTO {
  /**
   * GC Notify template id used to send the email.
   */
  templateId: string;
  /**
   * Recipient of the notification.
   */
  recipientType: WorkflowEmailNotificationRecipient;
}
