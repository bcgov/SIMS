/**
 * Status of a form submission item (individual decision), indicating whether it is pending,
 * approved, or declined. Each item within a form submission will be assessed individually,
 * and this status reflects the decision for that specific item. A declined item may be part
 * of an approved submission when some other items were approved.
 */
export enum FormSubmissionDecisionStatus {
  /**
   * The form submission item is still pending decision.
   */
  Pending = "Pending",
  /**
   * The form submission item has been approved.
   */
  Approved = "Approved",
  /**
   * The form submission item has been declined.
   */
  Declined = "Declined",
}
