import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
} from "@sims/sims-db";
import { ECertProcessStep } from "./e-cert-steps-models";
import { EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Wraps up a series of e-Cert calculations steps, marking the disbursement as
 * ready to be sent and persisting all modifications related to the disbursement
 * and its cascading configured updates.
 */
@Injectable()
export class PersistCalculationsStep implements ECertProcessStep {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  /**
   * Persists all calculations executed for the disbursement also changing
   * its status to {@link DisbursementScheduleStatus.ReadToSend}.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Saving all e-Cert calculations.");
    const now = new Date();
    const disbursement = eCertDisbursement.disbursement;
    disbursement.disbursementScheduleStatus =
      DisbursementScheduleStatus.ReadToSend;
    disbursement.readyToSendDate = now;
    disbursement.modifier = this.systemUsersService.systemUser;
    disbursement.updatedAt = now;
    await entityManager.getRepository(DisbursementSchedule).save(disbursement);
    log.info(
      `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadToSend}'.`,
    );
    return true;
  }
}
