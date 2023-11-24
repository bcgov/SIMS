import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  DisbursementSchedule,
  DisbursementValue,
  DisbursementValueType,
} from "@sims/sims-db";
import { BC_TOTAL_GRANT_AWARD_CODE } from "@sims/services/constants";
import { ECertProcessStep } from "./e-cert-steps-models";
import { EntityManager } from "typeorm";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class CreateBCTotalGrantsStep implements ECertProcessStep {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student
   * or by overaward deductions or {@link RestrictionActionType.StopFullTimeBCFunding}
   * restriction.
   * @param disbursement disbursement with the BC grants to be calculated.
   * @param _entityManager not used.
   * @param log cumulative log summary.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    _entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info(
      `Create ${DisbursementValueType.BCTotalGrant} (sum of the other BC Grants)`,
    );
    const auditUser = await this.systemUsersService.systemUser();
    // For each schedule calculate the total BC grants.
    let bcTotalGrant = disbursement.disbursementValues.find(
      (disbursementValue) =>
        disbursementValue.valueType === DisbursementValueType.BCTotalGrant,
    );
    if (!bcTotalGrant) {
      // If the 'BC Total Grant' is not present, add it.
      bcTotalGrant = new DisbursementValue();
      bcTotalGrant.creator = auditUser;
      bcTotalGrant.valueCode = BC_TOTAL_GRANT_AWARD_CODE;
      bcTotalGrant.valueType = DisbursementValueType.BCTotalGrant;
      disbursement.disbursementValues.push(bcTotalGrant);
    }
    const bcTotalGrantValueAmount = disbursement.disbursementValues
      // Filter all BC grants.
      .filter(
        (disbursementValue) =>
          disbursementValue.valueType === DisbursementValueType.BCGrant,
      )
      // Sum all BC grants.
      .reduce((previousValue, currentValue) => {
        return previousValue + currentValue.effectiveAmount;
      }, 0);
    bcTotalGrant.valueAmount = bcTotalGrantValueAmount;
    bcTotalGrant.effectiveAmount = bcTotalGrantValueAmount;
    return true;
  }
}
