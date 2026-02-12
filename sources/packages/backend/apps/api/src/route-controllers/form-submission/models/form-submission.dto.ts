// TODO: This DTOs will have its final version once API is fully integrated.
import { FormCategory } from "@sims/sims-db";

export class SubmissionFormConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

export class SubmissionFormConfigurationsAPIOutDTO {
  configurations: SubmissionFormConfigurationAPIOutDTO[];
}
