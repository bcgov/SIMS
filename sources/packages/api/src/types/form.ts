export interface DryRunSubmissionResult {
  valid: boolean;
  data?: any;
  formName: string;
}

export interface SubmissionResult {
  submissionId: string;
  state: string;
  data: any;
  formId: string;
  absolutePath: string;
  valid: boolean;
}
