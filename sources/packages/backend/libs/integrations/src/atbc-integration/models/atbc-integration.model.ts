import { DisabilityStatus } from "@sims/sims-db";
/**
 * Student disability status details.
 */
export interface StudentDisabilityStatusDetail {
  sin: string;
  lastName: string;
  birthDate: Date;
  disabilityStatus: DisabilityStatus;
  disabilityStatusUpdatedDate: Date;
}
