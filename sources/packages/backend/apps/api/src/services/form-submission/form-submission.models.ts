import { DynamicFormConfiguration } from "@sims/sims-db/entities";
import { Parent } from "../../types";

/**
 * Optional data that can be loaded as part of the form.
 */
export enum KnownSupplementaryDataKey {
  ProgramYear = "programYear",
  Parents = "parents",
}

export interface KnownSupplementaryData {
  [KnownSupplementaryDataKey.ProgramYear]?: string;
  [KnownSupplementaryDataKey.Parents]?: Parent[];
}

export interface FormSubmissionModel {
  dynamicConfigurationId: number;
  formData: KnownSupplementaryData & Record<string, unknown>;
  files: string[];
}

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
  > & {
    applicationId: number | undefined;
  };
