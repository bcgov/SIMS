import { DisbursementSchedule } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";

export interface ECertProcessStep {
  executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> | void;
}
