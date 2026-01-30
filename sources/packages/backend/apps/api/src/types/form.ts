export interface DryRunSubmissionResult<T = any> {
  valid: boolean;
  data?: { data: T };
  formName: string;
  dynamicConfigurationId?: number;
}
