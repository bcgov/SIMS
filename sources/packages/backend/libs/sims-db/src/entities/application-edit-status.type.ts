/**
 * Status of the "application edit"(a.k.a. change request) that allows to track the changes and approvals.
 * An application edition can be requested before or after an application is completed, which leads
 * to different paths controlled by this status.
 * If the application is edited before is has its main status set to "Completed" (a.k.a. before COE),
 * the edit can be executed without any Ministry approval.
 * If the application is edited after it has its main status set to "Completed" (a.k.a. after COE),
 * the edit must be approved by the Ministry.
 */
export enum ApplicationEditStatus {
  /**
   * Default status when the application was never edited in any way.
   * This status will likely associated to draft applications.
   */
  Original = "Original",
  /**
   * Status for applications that are being edited after COE and Ministry approval is needed.
   */
  ChangeInProgress = "Change in progress",
  /**
   * Status for applications that are being edited after COE and Ministry approval time
   * is requested and pending.
   */
  ChangePendingApproval = "Change pending approval",
  /**
   * Status for applications that are being edited after COE and Ministry declined the edit.
   */
  ChangeDeclined = "Change declined",
  /**
   * Status for applications that are being edited after COE and Ministry has approved it.
   */
  ChangedWithApproval = "Changed with approval",
  /**
   * When the edit was executed and no Ministry approval was needed (a.k.a. edit before COE).
   */
  Edited = "Edited",
}
