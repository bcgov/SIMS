import {
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";

/**
 * Submission item information shared across all actions to be performed on a form submission.
 */
export interface FormSubmissionItemActionModel {
  id: number;
  actions: FormSubmissionActionType[];
  decisionStatus: FormSubmissionDecisionStatus;
}

/**
 * Submission information shared across all actions to be performed on a form submission.
 */
export interface FormSubmissionActionModel {
  id: number;
  studentId: number;
  formCategory: FormCategory;
  /**
   * Present only for application-based form submissions.
   */
  applicationId?: number;
  /**
   * Present only for application-based form submissions when the current assessment is available.
   */
  currentOfferingId?: number;
  submissionItems: FormSubmissionItemActionModel[];
}
