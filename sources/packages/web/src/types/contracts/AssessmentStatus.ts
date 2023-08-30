/**
 * Possible status for an Assessment, when the Application_status is in Assessment
 */
export enum AssessmentStatus {
  /**
   * An Assessment is required
   */
  required = "Required",
  /**
   * An Assessment is not required, not used in our current workflow but having it as an placeholder
   */
  notRequired = "Not Required",
  /**
   * An Assessment is Completed
   */
  completed = "Completed",
  /**
   * An Assessment is Declined,  not used in our current workflow but having it as an placeholder
   */
  declined = "Declined",
}

/**
 * Student assessment statuses from its creation till the
 * assessment gateway workflow is finalized.
 */
export enum StudentAssessmentStatus {
  /**
   * Student assessment status is considered submitted,
   * when the assessmentWorkflowId is null.
   * @deprecated to be replaced by "Created" status.
   */
  Submitted = "Submitted",
  /**
   * Student assessment was created.
   */
  Created = "Created",
  /**
   * Student assessment was selected and sent to the queue to be
   * processed by Camunda.
   */
  Queued = "Queued",
  /**
   * Assessment gateway workflow started.
   */
  Inprogress = "In progress",
  /**
   * Assessment gateway workflow completed, all calculations are done,
   * and output data was saved.
   */
  Completed = "Completed",
  /**
   * A cancellation was requested.
   */
  CancellationRequested = "Cancellation requested",
  /**
   * The cancellation was queued to be processed.
   */
  CancellationQueued = "Cancellation queued",
  /**
   * All processes required to have the workflow cancelled are done.
   */
  Cancelled = "Cancelled",
}
