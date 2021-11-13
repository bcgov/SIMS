/**
 * Generic types of loan and grants that could
 * be associated with a disbursement.
 */
export enum DisbursementValueType {
  /**
   * Total of Canada Loan (federal loan).
   */
  CanadaLoan = "Canada Loan",
  /**
   * Represents different types of federal grants
   * that will be reported to ESDC (e.g. CSGP, CSGD, CSGT).
   */
  CanadaGrant = "Canada Grant",
  /**
   * Total of BC Loan (provincial loan).
   */
  BCLoan = "BC Loan",
  /**
   * Represents different types of provincial grants.
   * These grants are not reported individually to ESDC.
   * Only the sum of all 'BC Grants' are reported as a single
   * value defined as 'BC Total Grant'.
   */
  BCGrant = "BC Grant",
  /**
   * Represents the sun of the total provincial grants that
   * must be reported to ESDC. The individual BC Grants are not
   * reported individually, only the total.
   */
  BCTotalGrant = "BC Total Grant",
}
