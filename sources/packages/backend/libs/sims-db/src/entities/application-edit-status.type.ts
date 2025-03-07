/**
 * Status of the application edit that allows to track the changes and approvals.
 */
export enum ApplicationEditStatus {
  /**
   * Default status when the application was never edited in any way.
   */
  Original = "Original",
  /**
   * Status for the new application version to be edited post COE.
   */
  ChangeInProgress = "Change in progress",
  /**
   * The workflow is being executed and did not reach the "Ministry approval" yet.
   */
  ChangePendingApproval = "Change pending approval",
  /**
   * When the edit was requested after COE and Ministry declined it.
   */
  ChangeDeclined = "Change declined",
  /**
   * When the edit was requested after COE and Ministry accepted it.
   */
  ChangedWithApproval = "Changed with approval",
  /**
   * When the edit was executed and no Ministry approval was needed (edit before COE).
   */
  Edited = "Edited",
}
