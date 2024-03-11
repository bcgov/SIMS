/**
 * Canadian provinces.
 */
export enum Provinces {
  Alberta = "AB",
  BritishColumbia = "BC",
  Manitoba = "MB",
  NewBrunswick = "NB",
  NewFoundlandAndLabrador = "NL",
  NovaScotia = "NS",
  Ontario = "ON",
  PrinceEdwardIsland = "PE",
  Quebec = "QC",
  Saskatchewan = "SK",
  Yukon = "YT",
  NorthernTerritories = "NT",
  Nunavut = "NU",
}

export enum YesNoOptions {
  Yes = "yes",
  No = "no",
}

/**
 * Offering delivery options.
 */
export enum OfferingDeliveryOptions {
  Onsite = "onsite",
  Online = "online",
  Blended = "blended",
}

/**
 * The load consolidated assessment data can be happen for three different scenarios:
 * 1. When the application is submitted for the first time ever;
 * 2. After the data collection happens (PIR, parents, partner, income);
 * 3. During a reassessment.
 * For the scenario 1, the load assessment will return less data, since the collection phase
 * did not happen yet.
 * For the scenarios 2 and 3, the data is fully acquired and the assessment calculation can happen.
 * This enum defines the 2 different moments for the 3 different scenarios where there is a
 * difference between the data returned.
 */
export enum AssessmentDataType {
  /**
   * PIR, parents, partner, income, etc. did not happen yet and the assessment consolidated
   * data is pretty much the data reported by the student on the application form.
   */
  Submit,
  /**
   * All data needed was acquired and the assessment is ready to be calculated.
   */
  PreAssessment,
}

/**
 * Restriction codes.
 */
export enum RestrictionCode {
  /**
   * When an institution report withdrawal for a FT course on a
   * student with a "WTHD" restriction , then "SSR" restriction
   * is added to the student account.
   */
  SSR = "SSR",
  /**
   * Legacy Restriction.
   */
  LGCY = "LGCY",
  /**
   * Restriction for Bankruptcy with no student loans included.
   */
  B6B = "B6B",
  /**
   * Restriction for False/Misleading Information.
   */
  AF = "AF",
  /**
   * Verification restriction on file. Set up call back for Student case review verification team.
   */
}
