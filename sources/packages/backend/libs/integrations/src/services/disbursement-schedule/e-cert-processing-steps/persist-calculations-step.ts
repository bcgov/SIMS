import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValue,
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
   * its status to {@link DisbursementScheduleStatus.ReadyToSend}.
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
    const auditUser = this.systemUsersService.systemUser;
    // Persists the changes to the disbursement.
    // Using update instead save for better performance.
    const disbursementScheduleRepo =
      entityManager.getRepository(DisbursementSchedule);
    disbursementScheduleRepo.update(
      { id: disbursement.id },
      {
        disbursementScheduleStatus: DisbursementScheduleStatus.ReadyToSend,
        readyToSendDate: now,
        tuitionRemittanceEffectiveAmount:
          disbursement.tuitionRemittanceEffectiveAmount,
        modifier: auditUser,
        updatedAt: now,
        disbursementScheduleStatusUpdatedBy: auditUser,
        disbursementScheduleStatusUpdatedOn: now,
      },
    );
    // Persist the changes to the disbursement values.
    // Using update instead save for better performance.
    const disbursementValueRepo =
      entityManager.getRepository(DisbursementValue);
    const disbursementValuesUpdatesPromises =
      disbursement.disbursementValues.map((disbursementValue) => {
        return disbursementValueRepo.update(
          { id: disbursementValue.id },
          {
            overawardAmountSubtracted:
              disbursementValue.overawardAmountSubtracted,
            restrictionAmountSubtracted:
              disbursementValue.restrictionAmountSubtracted,
            restrictionSubtracted: disbursementValue.restrictionSubtracted,
            effectiveAmount: disbursementValue.effectiveAmount,
            modifier: this.systemUsersService.systemUser,
            updatedAt: now,
          },
        );
      });
    await Promise.all(disbursementValuesUpdatesPromises);
    log.info(
      `All calculations were saved and disbursement was set to '${DisbursementScheduleStatus.ReadyToSend}'.`,
    );
    return true;
  }
}
