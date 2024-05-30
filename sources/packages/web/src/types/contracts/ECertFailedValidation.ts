/**
 * Possible failed results from an e-Cert validation.
 * An disbursement could be either ready to be disbursed and just waiting
 * for the proper date to be sent or it can have multiple issues that would
 * prevent it from being disbursed.
 */
export enum ECertFailedValidation {
  /**
   * Waiting for confirmation of enrolment to be completed.
   */
  NonCompletedCOE = "NonCompletedCOE",
  /**
   * Student SIN is invalid or the validation is pending.
   */
  InvalidSIN = "InvalidSIN",
  /**
   * Student MSFAA associated with the disbursement is cancelled.
   */
  MSFAACanceled = "MSFAACanceled",
  /**
   * Student MSFAA associated with the disbursement is not signed.
   */
  MSFAANotSigned = "MSFAANotSigned",
  /**
   * Student MSFAA associated with the disbursement is not signed or is cancelled.
   */
  MSFAANotValid = "MSFAANotValid",
  /**
   * Student disability Status PD/PPD is not verified.
   */
  DisabilityStatusNotConfirmed = "DisabilityStatusNotConfirmed",
  /**
   * Student has an active 'StopFullTimeDisbursement' or 'StopPartTimeDisbursement'
   * restriction and the disbursement calculation will not proceed.
   */
  HasStopDisbursementRestriction = "HasStopDisbursementRestriction",
  /**
   * Lifetime maximum CSLP is reached.
   * Affects only part-time disbursements.
   */
  LifetimeMaximumCSLP = "LifetimeMaximumCSLP",
}
