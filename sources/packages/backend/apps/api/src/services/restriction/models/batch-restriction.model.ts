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
