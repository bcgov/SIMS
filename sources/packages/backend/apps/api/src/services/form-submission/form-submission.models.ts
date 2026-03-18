import {
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { Parent } from "../../types";
import { Role } from "../../auth";

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
    | "formType"
    | "formCategory"
    | "hasApplicationScope"
    | "allowBundledSubmission"
  > & {
    applicationId: number | undefined;
  };

/**
 * Allowed role to update a form submission item based on the form category.
 */
export const FORM_SUBMISSION_APPROVAL_ROLES_MAP = new Map<FormCategory, Role>([
  [FormCategory.StudentAppeal, Role.StudentApproveDeclineAppeals],
  [FormCategory.StudentForm, Role.StudentApproveDeclineForms],
]);

export interface FormSubmissionCompletionItem {
  submissionItemId: number;
  lastUpdateDate: Date;
}

/**
 * Ministry individual form item decision update.
 */
export interface FormItemDecision {
  decisionStatus: FormSubmissionDecisionStatus;
  noteDescription: string;
  lastUpdateDate: Date;
}

/**
 * Summary of a pending form submission item for the ministry queue view.
 * Each entry represents one pending submission that can include multiple forms.
 */
export interface FormSubmissionPendingSummary {
  formSubmissionId: number;
  studentId: number;
  submittedDate: Date;
  firstName?: string;
  lastName: string;
  formNames: string[];
  applicationId?: number;
  applicationNumber?: string;
}
