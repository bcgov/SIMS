// TODO: These DTOs will have their final version once the API is fully integrated.
// TODO: Ensure the DTOs will be converted to interfaces, following the pattern used in other API DTOs, once the API is fully integrated.
import {
  FormCategory,
  FormSubmissionStatus,
  FormSubmissionDecisionStatus,
  KnownSupplementaryData,
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

export class FormSupplementaryDataAPIInDTO {
  dataKeys: string[];
  applicationId?: number;
}

export class FormSupplementaryDataAPIOutDTO {
  formData: KnownSupplementaryData;
}
