/**
 * Student assessment statuses from its creation till the workflow
 * calculations are finalized or the workflow is cancelled.
 */
export enum StudentAssessmentStatus {
  /**
   * Student assessment status is considered submitted,
   * when the assessmentWorkflowId is null.
   * TODO: to be removed once the assessment queues are in place.
   * @deprecated to be replaced by the "Created" status.
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
