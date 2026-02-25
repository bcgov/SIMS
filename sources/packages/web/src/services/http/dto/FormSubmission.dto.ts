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
interface FormSubmissionAPIOutDTO {
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
interface FormSubmissionItemAPIOutDTO {
  id: number;
  formType: string;
  formCategory: FormCategory;
  /**
   * Current decision status for this form submission item. The current decision status represents the most recent decision made on
   * this item and represents the current state of the item and should be available for all users to see.
   */
  decisionStatus: FormSubmissionDecisionStatus;
  dynamicFormConfigurationId: number;
  submissionData: unknown;
  formDefinitionName: string;
  updatedAt: Date;
}

/**
 * Current decision associated with a form submission item.
 * If the no decision is present yet, the status will be Pending and the other properties will be undefined.
 */
interface FormSubmissionItemDecisionAPIOutDTO {
  id?: number;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
  decisionBy?: string;
  decisionNoteDescription?: string;
}

/**
 * Individual form items that will be part of a form submission with one to many forms
 * for the Ministry, including the decision details.
 */
export interface FormSubmissionItemMinistryAPIOutDTO extends FormSubmissionItemAPIOutDTO {
  /**
   * Current decision details for this form submission item. The current decision is the most recent decision made on
   * this item and represents the current state of the item.
   * Optionally include decision information if the user has the necessary permissions to view the decision details.
   */
  currentDecision?: FormSubmissionItemDecisionAPIOutDTO;
  /**
   * Decision history for this form submission item. The decision history includes all decisions made on this item,
   * including the current decision and any previous decisions.
   * Optionally include decision history information if the user has the necessary permissions to view the decision details.
   */
  decisions?: FormSubmissionItemDecisionAPIOutDTO[];
}

/**
 * Form submission with one to many forms for the Ministry,
 * including the individual form items.
 */
export interface FormSubmissionMinistryAPIOutDTO extends FormSubmissionAPIOutDTO {
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
