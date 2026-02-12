// TODO: These DTOs will have their final version once the API is fully integrated.
import { FormCategory } from "@sims/sims-db";

export class FormSubmissionConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

export class FormSubmissionConfigurationsAPIOutDTO {
  configurations: FormSubmissionConfigurationAPIOutDTO[];
}
