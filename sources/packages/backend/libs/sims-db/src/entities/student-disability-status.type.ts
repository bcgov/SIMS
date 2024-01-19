/**
 * Disability status of student.
 */
export enum DisabilityStatus {
  NotRequested = "Not requested",
  Requested = "Requested",
  /** Permanent Disability. */
  PD = "PD",
  /** Persistent and Prolonged Disability.*/
  PPD = "PPD",
  Declined = "Declined",
}

/**
 *  Disability status description.
 */
export const DisabilityStatusDescription: Record<DisabilityStatus, string> = {
  [DisabilityStatus.NotRequested]: "Not requested",
  [DisabilityStatus.Requested]: "Requested",
  [DisabilityStatus.PD]: "Approved for Permanent Disability",
  [DisabilityStatus.PPD]: "Approved for Persistent or Prolonged Disability",
  [DisabilityStatus.Declined]: "Declined",
};
