import { BatchRestrictionStudent } from "@sims/sims-db";

/**
 * Sort field received from the API to sort the batch restriction
 * students by application number.
 */
export const BATCH_RESTRICTION_STUDENT_APPLICATION_NUMBER_SORT_FIELD =
  "applicationNumber";

/**
 * Maps the sort fields received from the API to the
 * {@link BatchRestrictionStudent} entity properties, prefixed
 * with the "batchStudent" alias used in the query.
 */
export const BATCH_RESTRICTION_STUDENT_SORT_FIELDS: Record<
  string,
  `batchStudent.${keyof BatchRestrictionStudent}`
> = {
  [BATCH_RESTRICTION_STUDENT_APPLICATION_NUMBER_SORT_FIELD]:
    "batchStudent.applicationNumber",
};

/**
 * Summary of a batch restriction submission.
 */
export interface BatchRestrictionSummary {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorFirstName: string;
  creatorLastName: string;
  restrictionCode: string;
  restrictionDescription: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

/**
 * Result of adding the restriction to a student in a batch restriction.
 */
export enum BatchRestrictionStudentResult {
  /**
   * The restriction was added to the student or was already active.
   */
  Successful = "Successful",
  /**
   * The restriction could not be added to the student.
   */
  Failed = "Failed",
}
