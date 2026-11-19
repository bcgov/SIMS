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
 * Details of a batch restriction submission.
 */
export interface BatchRestrictionDetails {
  id: number;
  batchNumber: number;
  restrictionCode: string;
  restrictionDescription: string;
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

/**
 * Outcome of a single student included in a batch restriction.
 */
export interface BatchRestrictionStudentOutcome {
  applicationNumber: string;
  studentId?: number;
  result: BatchRestrictionStudentResult;
  failureReason?: string;
}
