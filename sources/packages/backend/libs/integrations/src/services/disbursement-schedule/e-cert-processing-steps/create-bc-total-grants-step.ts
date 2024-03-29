import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import { DisbursementValue, DisbursementValueType } from "@sims/sims-db";
import { BC_TOTAL_GRANT_AWARD_CODE } from "@sims/services/constants";
import { ECertProcessStep } from "./e-cert-steps-models";
import { EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";

/**
 * Calculate the BCSG that represents the sum of all BC grants
 * as they should be added to the e-Cert.
 */
@Injectable()
export class CreateBCTotalGrantsStep implements ECertProcessStep {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student
   * or by overaward deductions or "stop full time BC funding" restrictions.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * If no BC grants are present the total will still be add as zero.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info(
      `Create ${DisbursementValueType.BCTotalGrant} (sum of the other BC Grants)`,
    );
    // Calculate the total BC grants.
    const bcTotalGrantValueAmount =
      eCertDisbursement.disbursement.disbursementValues
        // Filter all BC grants.
        .filter(
          (disbursementValue) =>
            disbursementValue.valueType === DisbursementValueType.BCGrant,
        )
        // Sum all BC grants.
        .reduce((previousValue, currentValue) => {
          return previousValue + currentValue.effectiveAmount;
        }, 0);
    const bcTotalGrant = new DisbursementValue();
    bcTotalGrant.disbursementSchedule = eCertDisbursement.disbursement;
    bcTotalGrant.creator = this.systemUsersService.systemUser;
    bcTotalGrant.valueCode = BC_TOTAL_GRANT_AWARD_CODE;
    bcTotalGrant.valueType = DisbursementValueType.BCTotalGrant;
    bcTotalGrant.valueAmount = bcTotalGrantValueAmount;
    bcTotalGrant.effectiveAmount = bcTotalGrantValueAmount;
    await entityManager.getRepository(DisbursementValue).insert(bcTotalGrant);
    return true;
  }
}
