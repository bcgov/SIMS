import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class PersistCalculationsStep implements ECertProcessStep {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  /**
   * Persis all calculations executed for the disbursement also changing
   * its status to {@link DisbursementScheduleStatus.ReadToSend}.
   * @param disbursement disbursement object with all modifications to be saved.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info(`Saving all e-Cert calculations.`);
    const now = new Date();
    disbursement.disbursementScheduleStatus =
      DisbursementScheduleStatus.ReadToSend;
    disbursement.readyToSendDate = now;
    disbursement.modifier = await this.systemUsersService.systemUser();
    disbursement.updatedAt = now;
    await entityManager.getRepository(DisbursementSchedule).save(disbursement);
    log.info(
      `All calculations were saved and disbursement set to '${DisbursementScheduleStatus.ReadToSend}'.`,
    );
    return true;
  }
}
