import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionGrouping,
  FormSubmissionStatus,
} from "@/types";

interface FormSubmissionItemAPIOutDTO {
  formType: string;
  status: FormSubmissionDecisionStatus;
}

export interface FormSubmissionAPIOutDTO {
  id: number;
  formCategory: FormCategory;
  status: FormSubmissionStatus;
  applicationId?: number;
  applicationNumber?: string;
  submittedDate: Date;
  assessedDate?: Date;
  submissionItems: FormSubmissionItemAPIOutDTO[];
}

export interface FormSubmissionsAPIOutDTO {
  submissions: FormSubmissionAPIOutDTO[];
}

export interface FormSubmissionItemAPIInDTO {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
}

export interface FormSubmissionAPIInDTO {
  formCategory: FormCategory;
  submissionGrouping: FormSubmissionGrouping;
  applicationId?: number;
  items: FormSubmissionItemAPIInDTO[];
}
