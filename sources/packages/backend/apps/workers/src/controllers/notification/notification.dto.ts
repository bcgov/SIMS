import { EmailNotificationRecipient } from "@sims/services/notifications";
import { NotificationMetadata } from "@sims/sims-db/entities/notification-metadata.type";

/**
 * Personalisation context provided by the workflow, mapping each GC Notify
 * personalisation variable name to the path of the value in the notification
 * data resolved on the API side (e.g. `{ givenNames: "studentGivenNames" }`).
 * The values are not the personalisation data themselves but references to it,
 * since the personal information is not available in the workflow due to
 * personal information constraints.
 */
export type NotificationPersonalisationContext = Record<string, string>;

/**
 * Notification data resolved on the API side used as the source of the values
 * referenced by the personalisation context provided by the workflow.
 */
export interface NotificationPersonalisationData {
  /**
   * User id of the student, used to address the notification to the student.
   */
  studentUserId: number;
  /**
   * Email of the student, used to address the notification to the student.
   */
  studentEmail: string;
  /**
   * Given names of the student.
   */
  studentGivenNames: string;
  /**
   * Last name of the student.
   */
  studentLastName: string;
  /**
   * Application number associated with the assessment.
   */
  applicationNumber: string;
}

/**
 * Variables required by the send email notification worker.
 */
export interface SendEmailNotificationJobInDTO {
  /**
   * Assessment id used to load the notification data on the API side.
   */
  assessmentId?: number;
  /**
   * Personalisation context provided by the workflow, mapping each GC Notify
   * personalisation variable name to the path of the value to be resolved from
   * the notification data loaded on the API side.
   */
  personalisation?: NotificationPersonalisationContext;
  /**
   * Free-form metadata provided by the workflow used to check whether the same
   * notification was already sent, preventing duplicate emails. When provided,
   * the notification is created only if no notification for the same message
   * already exists with matching metadata.
   */
  metadata?: NotificationMetadata;
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
  recipientType: EmailNotificationRecipient;
}
