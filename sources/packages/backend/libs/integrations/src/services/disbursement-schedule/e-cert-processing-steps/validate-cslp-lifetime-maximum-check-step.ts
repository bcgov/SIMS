import { Injectable } from "@nestjs/common";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ECertGenerationService } from "../e-cert-generation.service";
import { CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE } from "@sims/services/constants";

/**
 * Fetch the latest  balance for the student and validate if CSLP has reached lifetime maximum.
 */
@Injectable()
export class ValidateCSLPLifetimeMaximumCheckStep implements ECertProcessStep {
  constructor(
    private readonly eCertGenerationService: ECertGenerationService,
  ) {}

  /**
   * Validate if CSLP disbursed exceeded the lifetime maximums.
   * @param eCertDisbursement eligible disbursement to be potentially added to an e-Cert.
   * @param entityManager used to execute the commands in the same transaction.
   * @param log cumulative log summary.
   */
  async executeStep(
    eCertDisbursement: EligibleECertDisbursement,
    entityManager: EntityManager,
    log: ProcessSummary,
  ): Promise<boolean> {
    log.info("Validate CSLP Lifetime Maximum.");
    const lifetimeMaximumsCSLP =
      await this.eCertGenerationService.getCSLPLifetimeMaximums(
        eCertDisbursement.assessmentId,
        entityManager,
      );
    const totalDisbursementCSLPAmount =
      eCertDisbursement.disbursement.disbursementValues
        .filter(
          (item) => item.valueCode === CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
        )
        .map((item) => item.valueAmount)
        .reduce(
          (previousValue, currentValue) => previousValue + currentValue,
          0,
        );
    return lifetimeMaximumsCSLP > totalDisbursementCSLPAmount;
  }
}
