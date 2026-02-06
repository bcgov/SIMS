import { FormCategory } from "@/types";

export interface DynamicFormConfigurationAPIOutDTO {
  id: number;
  formDefinitionName: string;
  formType: string;
  formCategory: FormCategory;
  formDescription: string;
  allowBundledSubmission: boolean;
  hasApplicationScope: boolean;
}

export class DynamicFormConfigurationsAPIOutDTO {
  configurations: DynamicFormConfigurationAPIOutDTO[];
}
