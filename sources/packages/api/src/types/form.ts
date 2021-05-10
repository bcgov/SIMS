export interface DryRunSubmissionResult {
  valid: boolean;
  data?: any;
}

export interface SubmissionResult {
  submissionId: string;
  state: string;
  data: any;
  formId: string;
  absolutePath: string;
  valid: boolean;
}
