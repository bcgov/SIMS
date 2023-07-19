import { DisabilityStatus } from "@sims/sims-db";

export interface StudentDisabilityStatusDetail {
  sin: string;
  lastName: string;
  birthDate: Date;
  disabilityStatus: DisabilityStatus;
  disabilityStatusUpdatedDate: Date;
}
