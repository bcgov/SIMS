/**
 * Payload to add a restriction, in a single batch, to the students
 * associated with the provided application numbers.
 */
export interface BatchRestrictionAPIInDTO {
  restrictionId: number;
  applicationNumbers: string[];
  note: string;
}

/**
 * Summary of a batch restriction submission, including how many
 * restrictions were successfully added and how many failed.
 */
export interface BatchRestrictionSummaryAPIOutDTO {
  id: number;
  batchNumber: number;
  createdAt: Date;
  creatorName: string;
  restrictionCode: string;
  restrictionDescription: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}
