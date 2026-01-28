import { FormCategory, FormSubmissionGrouping } from "@/types";

export interface DynamicFormConfigurationAPIOutDTO {
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formSubmissionGrouping?: FormSubmissionGrouping;
}

export class DynamicFormConfigurationsAPIOutDTO {
  configurations: DynamicFormConfigurationAPIOutDTO[];
}
