import { DisbursementValueType } from "@sims/sims-db";

export interface DisbursementSaveValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface DisbursementSaveModel {
  disbursementDate: string;
  negotiatedExpiryDate: string;
  disbursements: DisbursementSaveValue[];
}

/**
 * Total disbursed award information.
 */
export interface TotalDisbursedAward {
  /**
   * Money effectively disbursed to the student and included in the e-Cert.
   */
  effectiveAmount: number;
  /**
   * Money that the student is repaying to the Ministry due to overaward.
   * In case the student had some overaward credits, and assuming an application
   * was impacted by some overaward deductions, this value will be negative to
   * allow the Student to receive money back from the Ministry.
   */
  overawardAmount: number;
  /**
   * Total disbursed amount considered as paid to the student.
   * It should be the sum of the effective amount plus the overaward amount.
   */
  totalDisbursed: number;
}

/**
 * Total disbursed awards information.
 * A disbursed award is an award that was added to an e-Cert
 * and it is considered as paid to the student.
 * During the e-Cert calculation, overawards balances will be considered
 * to adjust the effective amount disbursed to the student.
 * When some awards have overawards, the total disbursed amount
 * considered as paid to the student will be the effective amount (money the student will receive)
 * plus the overaward amount (money the student is repaying to the Ministry).
 */
export type TotalDisbursedAwards = {
  /**
   * The award code (e.g., CSLF, BCSL, CSGP, BGPD, etc.),
   * and its total disbursed information, if present in
   * any disbursement schedules for the application.
   */
  [awardCode: string]: TotalDisbursedAward;
};
