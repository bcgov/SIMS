import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
} from "@/types";

/**
 * Form configuration details necessary for form submission.
 * Dictates the necessary details for the client to render the form and submit the data,
 * including in which category the form belongs, whether it has application scope,
 * and whether it allows bundled submission.
 */
export interface FormSubmissionConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

/**
 * List of form configurations for form submission, currently used only to display
 * available forms for the student when starting a new form submission.
 */
export interface FormSubmissionConfigurationsAPIOutDTO {
  configurations: FormSubmissionConfigurationAPIOutDTO[];
}

/**
 * Form submission with one to many forms.
 * This is a basic representation of a form submission properties to be extended
 * for Ministry, Student, and Institutions.
 */
interface FormSubmissionBaseAPIOutDTO {
  id: number;
  formCategory: FormCategory;
  status: FormSubmissionStatus;
  applicationId?: number;
  applicationNumber?: string;
  submittedDate: Date;
  assessedDate?: Date;
}

/**
 * Individual form items that will be part of a form submission with one to many forms.
 * This is a basic representation of a form submission item properties to be extended
 * for Ministry, Student, and Institutions.
 */
interface FormSubmissionItemBaseAPIOutDTO {
  id: number;
  formType: string;
  formCategory: FormCategory;
  dynamicFormConfigurationId: number;
  submissionData: unknown;
  formDefinitionName: string;
}

/**
 * Form submission with one to many forms for the Ministry,
 * including the individual form items.
 */
export interface FormSubmissionAPIOutDTO extends FormSubmissionBaseAPIOutDTO {
  submissionItems: FormSubmissionItemAPIOutDTO[];
}

/**
 * List of form submissions for a student, including the
 * individual form items and their details.
 */
export class FormSubmissionsAPIOutDTO {
  submissions: FormSubmissionAPIOutDTO[];
}

/**
 * Current decision associated with a form submission item.
 */
export interface FormSubmissionItemDecisionAPIOutDTO {
  id?: number;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
  decisionBy?: string;
  decisionNoteDescription?: string;
}

/**
 * Current decision associated with a form submission item
 * with additional details for the Ministry, including the decision date and decision by.
 */
export interface FormSubmissionItemDecisionMinistryAPIOutDTO extends FormSubmissionItemDecisionAPIOutDTO {
  decisionDate?: Date;
  decisionBy?: string;
}

/**
 * Individual form items that will be part of a form submission with one to many forms.
 * This is a basic representation of a form submission item properties to be extended
 * for Ministry, Student, and Institutions.
 */
export interface FormSubmissionItemAPIOutDTO extends FormSubmissionItemBaseAPIOutDTO {
  /**
   * Current decision details for this form submission item. The current decision is the most recent decision made on
   * this item and represents the current state of the item.
   * Optionally include decision information if the user has the necessary permissions to view the decision details.
   */
  currentDecision: FormSubmissionItemDecisionAPIOutDTO;
}

/**
 * Individual form items that will be part of a form submission with one to many forms
 * for the Ministry, including the decision details.
 */
export interface FormSubmissionItemMinistryAPIOutDTO extends FormSubmissionItemAPIOutDTO {
  /**
   * Indicates if the user has authorization to make a decision on this form item.
   */
  hasAssessItemDecisionAuthorization: boolean;
  /**
   * Most recent update date for this form submission item. This is used to determine if the item is outdated when
   * submitting a decision on it, to prevent overwriting a more recent decision.
   */
  updatedAt: Date;
  /**
   * Current decision details for this form submission item. The current decision is the most recent decision made on
   * this item and represents the current state of the item.
   * Optionally include decision information if the user has the necessary permissions to view the decision details.
   */
  currentDecision: FormSubmissionItemDecisionMinistryAPIOutDTO;
  /**
   * Decision history for this form submission item. The decision history includes all decisions made on this but
   * the current one that is sent separately in the currentDecision property.
   * Optionally include decision history information if the user has the necessary permissions to view the decision details.
   */
  previousDecisions?: FormSubmissionItemDecisionMinistryAPIOutDTO[];
}

/**
 * Form submission with one to many forms for the Ministry,
 * including the individual form items.
 */
export interface FormSubmissionMinistryAPIOutDTO extends FormSubmissionBaseAPIOutDTO {
  hasAssessFinalDecisionAuthorization: boolean;
  submissionItems: FormSubmissionItemMinistryAPIOutDTO[];
}

/**
 * Forms supplementary data necessary for a dynamic form
 * submissions (e.g., program year, parents).
 */
export interface FormSupplementaryDataAPIInDTO {
  dataKeys: string[];
  applicationId?: number;
}

/**
 * Consolidated supplementary data for dynamic form submissions.
 * The keys of this object are dynamic based on the known supplementary
 * data keys requested by the client.
 */
export interface FormSupplementaryDataAPIOutDTO {
  formData: string;
}

/**
 * Student individual form item in the form submission.
 */
export interface FormSubmissionItemAPIInDTO {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
}

/**
 * Student form submission with one to many form items for individual Ministry decision.
 * All forms must belong to same category and may be related to an application.
 * When related to an application, the application ID must be provided and all
 * forms must have application scope.
 * For submissions with an application scope, that must enforce the applicationId,
 * the validation is executed outside the DTO scope.
 */
export interface FormSubmissionAPIInDTO {
  applicationId?: number;
  items: FormSubmissionItemAPIInDTO[];
}

/**
 * Ministry individual form item decision update.
 */
export interface FormSubmissionItemDecisionAPIInDTO {
  decisionStatus: FormSubmissionDecisionStatus;
  noteDescription: string;
  /**
   * Date when the decision record was last updated. Used for concurrency control
   * to prevent overwriting a more recent decision.
   */
  lastUpdateDate: Date;
}

/**
 * Decision item for form submission completion.
 * Mainly used to ensure that the form submission is not outdated when
 * the Ministry user tries to complete the form submission.
 */
export interface FormSubmissionCompletionItemAPIInDTO {
  submissionItemId: number;
  lastUpdateDate: Date;
}

/**
 * Ministry individual form item decision update.
 */
export interface FormSubmissionCompletionAPIInDTO {
  items: FormSubmissionCompletionItemAPIInDTO[];
}

/**
 * Summary of a pending form submission for the ministry queue.
 * Applies to all form submission categories, including student forms and appeals.
 */
export interface FormSubmissionPendingSummaryAPIOutDTO {
  formSubmissionId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  formNames: string[];
  applicationId?: number;
  applicationNumber?: string;
}
