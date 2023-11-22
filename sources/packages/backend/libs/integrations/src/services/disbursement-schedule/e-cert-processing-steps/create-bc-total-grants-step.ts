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

/**
 * Manages all the preparation of the disbursements data needed to
 * generate the e-Cert. Check and execute possible overawards deductions
 * and calculate the awards effective values to be used to generate the e-Cert.
 * All methods are prepared to be executed on a single transaction.
 */
@Injectable()
export class CreateBCTotalGrantsStep implements ECertProcessStep {
  constructor(private readonly systemUsersService: SystemUsersService) {}

  /**
   * Calculate the total BC grants for each disbursement since they
   * can be affected by the calculations for the values already paid for the student
   * or by overaward deductions. And calculate and record BC total grants that was used to
   * subtracted due to a {@link RestrictionActionType.StopFullTimeBCFunding} restriction.
   * @param disbursementSchedules disbursements to have the BC grants calculated.
   */
  async executeStep(
    disbursement: DisbursementSchedule,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<void> {
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
  }
}
