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
   * the appeals process and have multiple purposes.
   */
  StudentForm = "Student form",
  /**
   * Forms used along the system that are not directly
   * selected by users.
   */
  System = "System",
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
   * are no longer pending, at least one form was approved,
   * and the submission process is completed.
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

export interface DecisionHistory {
  id: number;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
  decisionBy?: string;
  decisionNoteDescription?: string;
  statusColor: string;
}

export interface FormSubmissionItemDecision {
  submissionItemId: number;
  parentName: string;
  parentStatus: FormSubmissionStatus;
  decisionStatus: FormSubmissionDecisionStatus;
  noteDescription?: string;
  decisionBy?: string;
  decisionNoteDescription?: string;
  decisionDate?: Date;
  showAudit: boolean;
  saveDecisionInProgress: boolean;
  decisionSaved: boolean;
  lastUpdateDate: Date;
  decisionHistory?: DecisionHistory[];
}

/**
 * Information required while student is submitting a form.
 */
export interface FormSubmissionItemSubmitted {
  /**
   * ID of the dynamic form configuration being submitted.
   */
  dynamicConfigurationId: number;
  /**
   * Dynamic form data.
   */
  formData: unknown;
  /**
   * Files are not required during the UI rendering for the student submission, but will be
   * populated with some file or an empty array when the student is submitting the form.
   */
  files: string[];
}

/**
 * Information required to render a form to be submitted by the student
 * or visualized by the Ministry or Institution.
 */
export interface FormSubmissionItem extends FormSubmissionItemSubmitted {
  /**
   * Form submission item ID. Present if the form item is already persisted.
   */
  id?: number;
  /**
   * Form category. All forms under the same submission will belong to the same category.
   */
  category: FormCategory;
  /**
   * Form type, which is used to identify the form and its structure.
   */
  formType: string;
  /**
   * Form definition name.
   */
  formName: string;
  /**
   * Current decision status for this form submission item, available for certain
   * user roles for Ministry, allowing a decision to be made and later auditing.
   */
  decision?: FormSubmissionItemDecision;
}
