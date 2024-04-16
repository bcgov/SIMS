import { Injectable } from "@nestjs/common";
import { ECertProcessStep } from "./e-cert-steps-models";
import { ProcessSummary } from "@sims/utilities/logger";
import { EntityManager } from "typeorm";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ECertGenerationService } from "../e-cert-generation.service";
import { CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE } from "@sims/services/constants";
import { StudentLoanBalanceSharedService } from "@sims/services/student-loan-balance/student-loan-balance-shared.service";
import { StudentLoanBalance } from "@sims/sims-db";

/**
 * Fetch the latest  balance for the student and validate if CSLP has reached lifetime maximum.
 */
@Injectable()
export class ValidateCSLPLifetimeMaximumCheckStep implements ECertProcessStep {
  constructor(
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly studentLoanBalanceSharedService: StudentLoanBalanceSharedService,
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
    //Fetch lifetime maximum of CSLP from the workflow data.
    const lifetimeMaximumsCSLP =
      await this.eCertGenerationService.getCSLPLifetimeMaximums(
        eCertDisbursement.assessmentId,
        entityManager,
      );
    //Get latest CSLP monthly balance.
    const studentLoanBalances: StudentLoanBalance[] =
      await this.studentLoanBalanceSharedService.getLatestCSLPBalance(
        eCertDisbursement.studentId,
      );
    //Get the disbursed value for the CSLP in the current disbursement.
    const disbursementCSLP =
      eCertDisbursement.disbursement.disbursementValues.find(
        (item) => item.valueCode === CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
      );
    //Check if lifetime maximum CSLP is less than or equal to the sum of disbursed CSLP and latest student loan balance.
    return (
      lifetimeMaximumsCSLP >=
      (disbursementCSLP ? disbursementCSLP.valueAmount : 0) +
        (studentLoanBalances[0] ? studentLoanBalances[0].cslBalance : 0)
    );
  }
}
