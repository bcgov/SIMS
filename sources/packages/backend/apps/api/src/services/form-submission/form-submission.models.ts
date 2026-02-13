import { DynamicFormConfiguration } from "@sims/sims-db/entities";
import { Parent } from "../../types";

export interface KnownSupplementaryData {
  programYear?: string;
  parents?: Parent[];
}

/**
 * Service model for student appeal.
 */
export interface FormSubmissionModel {
  dynamicConfigurationId: number;
  formData: KnownSupplementaryData & Record<string, unknown>;
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
