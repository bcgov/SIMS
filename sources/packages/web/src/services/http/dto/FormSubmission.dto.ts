// TODO: These DTOs will have their final version once the API is fully integrated.
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

// Submission summary (history).

export class FormSubmissionStudentSummaryAPIOutDTO {
  submissions: FormSubmissionStudentAPIOutDTO[];
}

// Get submission and items.

class FormSubmissionItemStudentAPIOutDTO extends FormSubmissionItemAPIOutDTO {}

export class FormSubmissionStudentAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemStudentAPIOutDTO[];
}
