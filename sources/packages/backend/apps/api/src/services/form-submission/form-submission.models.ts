import { DynamicFormConfiguration } from "@sims/sims-db/entities";
import { Parent } from "../../types";

/**
 * Service model for student appeal.
 */
export interface FormSubmissionModel {
  dynamicConfigurationId: number;
  formData: {
    programYear?: string;
    parents?: Parent[];
  } & Record<string, unknown>;
  files: string[];
}

export type FormSubmissionConfig = FormSubmissionModel &
  Pick<
    DynamicFormConfiguration,
    | "formDefinitionName"
    | "formCategory"
    | "hasApplicationScope"
    | "allowBundledSubmission"
  >;
