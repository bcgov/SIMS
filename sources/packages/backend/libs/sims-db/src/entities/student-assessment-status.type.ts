/**
 * Student assessment statuses from its creation till the workflow
 * calculations are finalized or the workflow is cancelled.
 */
export enum StudentAssessmentStatus {
  /**
   * Student assessment was submitted and it is waiting to be processed.
   */
  Submitted = "Submitted",
  /**
   * Student assessment was selected and sent to the queue to be
   * processed by Camunda.
   */
  Queued = "Queued",
  /**
   * Assessment gateway workflow started.
   */
  InProgress = "In progress",
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
