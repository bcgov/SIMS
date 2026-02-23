import { DynamicFormConfiguration } from "@sims/sims-db/entities";
import { Parent } from "../../types";

/**
 * Optional data that can be loaded as part of the form.
 */
export enum KnownSupplementaryDataKey {
  ProgramYear = "programYear",
  Parents = "parents",
}

/**
 * Expected structure of the supplementary data in the dynamic forms
 * that can be loaded for form submissions.
 */
export interface KnownSupplementaryData {
  [KnownSupplementaryDataKey.ProgramYear]?: string;
  [KnownSupplementaryDataKey.Parents]?: Parent[];
}

/**
 * Form submission item.
 */
export interface FormSubmissionModel {
  dynamicConfigurationId: number;
  formData: KnownSupplementaryData & Record<string, unknown>;
  files: string[];
}

/**
 * Combination of form submission item data and the necessary dynamic form configuration
 * properties required for the validation and processing of form submissions.
 */
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
