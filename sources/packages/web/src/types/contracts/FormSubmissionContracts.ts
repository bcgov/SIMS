/**
 * Defines the category of forms.
 */
export enum FormCategory {
  /**
   * Appeals related forms.
   */
  StudentAppeal = "Student appeal",
  /**
   * Any form submitted by a student that does not fall under
   * the appeals process and have multiple applications.
   */
  StudentForm = "Student form",
}

/**
 * Status for form submission that contains one to many
 * forms to be assessed and have a decision assigned.
 */
export enum FormSubmissionStatus {
  /**
   * The submission has one or more forms pending decision.
   */
  Pending = "Pending",
  /**
   * All forms within the submission were assessed and
   * are no longer pending. The decisions could be
   * approved or declined, either way the submission
   * process is completed.
   */
  Completed = "Completed",
  /**
   * All forms within the submission were assessed and
   * declined. The submission process is completed.
   * This helps to easily identify submissions where
   * all forms were declined.
   */
  Declined = "Declined",
}

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

export interface FormSubmissionItemApproval {
  id: number;
  parentName: string;
  status: FormSubmissionDecisionStatus;
  noteDescription: string;
  assessedDate?: string;
  assessedByUserName?: string;
  showAudit: boolean;
}

export interface FormSubmissionItem {
  dynamicConfigurationId: number;
  category: FormCategory;
  formType: string;
  formName: string;
  formData: unknown;
  files?: string[];
  approval?: FormSubmissionItemApproval;
}

export interface FormSubmissionItemSubmitted {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
  approval?: FormSubmissionItemApproval;
}
