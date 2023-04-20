import { DisbursementSchedule } from "@sims/sims-db";

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
  restrictionId?: number;
}
