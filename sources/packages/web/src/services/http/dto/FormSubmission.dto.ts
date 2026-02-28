// TODO: Ensure the DTOs will be converted to interfaces, following the pattern used in other API DTOs, once the API is fully integrated.
import {
  FormCategory,
  FormSubmissionStatus,
  FormSubmissionDecisionStatus,
} from "@/types";

export interface FormSubmissionConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

export interface FormSubmissionConfigurationsAPIOutDTO {
  configurations: FormSubmissionConfigurationAPIOutDTO[];
}

// Base classes for submission DTOs and submission items.

abstract class FormSubmissionAPIOutDTO {
  id: number;
  formCategory: FormCategory;
  status: FormSubmissionStatus;
  applicationId?: number;
  applicationNumber?: string;
  submittedDate: Date;
  assessedDate?: Date;
}

abstract class FormSubmissionItemAPIOutDTO {
  id: number;
  formType: string;
  formCategory: FormCategory;
  decisionStatus: FormSubmissionDecisionStatus;
  decisionDate?: Date;
  dynamicFormConfigurationId: number;
  submissionData: unknown;
  formDefinitionName: string;
}

export class FormSubmissionStudentSummaryAPIOutDTO {
  submissions: FormSubmissionStudentAPIOutDTO[];
}

class FormSubmissionItemStudentAPIOutDTO extends FormSubmissionItemAPIOutDTO {}

export class FormSubmissionStudentAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemStudentAPIOutDTO[];
}

/**
 * Individual form item in the form submission.
 */
export interface FormSubmissionItemAPIInDTO {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
}

/**
 * Form submission with one to many form items for individual Ministry decision.
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
  formData: Record<string, unknown>;
}

/**
 * Summary of a pending form submission for the ministry queue.
 */
export interface FormSubmissionPendingSummaryAPIOutDTO {
  formSubmissionId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  formNames: string[];
}
