/**
 * Types of users that provides supporting information
 * for the Student Application.
 */
export enum SupportingUserType {
  /**
   * Parent of a student submitting an application.
   */
  Parent = "Parent",
  /**
   * Partner of a student submitting an application.
   */
  Partner = "Partner",
}

/**
 * Types of users that appear in supporting information notifications.
 */
export enum NotificationSupportingUserType {
  /**
   * Single parent to appear in the notification.
   */
  Parent = "parent",
  /**
   * Plural parents to appear in the notification.
   */
  Parents = "parents",
  /**
   * Partner to appear in the notification.
   */
  Partner = "partner",
}
