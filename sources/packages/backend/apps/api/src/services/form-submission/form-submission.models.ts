/**
 * Service model for student appeal.
 */
export interface FormSubmissionModel {
  dynamicConfigurationId: number;
  formData: unknown;
  files: string[];
}
