import {
  FormCategory,
  FormSubmissionStatus,
  FormSubmissionDecisionStatus,
} from "@/types";

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

export class FormSubmissionMinistrySummaryAPIOutDTO {
  submissions: FormSubmissionMinistryAPIOutDTO[];
}

// Get submission and items.

class FormSubmissionItemMinistryAPIOutDTO extends FormSubmissionItemAPIOutDTO {}

export class FormSubmissionMinistryAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemMinistryAPIOutDTO[];
}

class FormSubmissionItemStudentAPIOutDTO extends FormSubmissionItemAPIOutDTO {}

export class FormSubmissionStudentAPIOutDTO extends FormSubmissionAPIOutDTO {
  submissionItems: FormSubmissionItemStudentAPIOutDTO[];
}

// Student submission.

export class FormSubmissionItemAPIInDTO {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
}

export class FormSubmissionAPIInDTO {
  applicationId?: number;
  items: FormSubmissionItemAPIInDTO[];
}

// Ministry submission.

export class FormSubmissionItemDecisionAPIInDTO {
  dynamicConfigurationId: number;
  decisionStatus: FormSubmissionDecisionStatus;
  noteDescription: string;
}

export class FormSubmissionFinalDecisionAPIInDTO {
  submissionId: number;
  submissionStatus: FormSubmissionStatus;
}
