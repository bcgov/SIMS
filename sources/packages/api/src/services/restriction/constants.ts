import { Restriction } from "src/database/entities";

/**
 * Restriction message for federal type
 */
export const RESTRICTION_FEDERAL_MESSAGE =
  "Your account has a hold on it. Please contact CSFA to resolve.";

/**
 * Restriction message for Provincial type
 */
export const RESTRICTION_PROVINCIAL_MESSAGE =
  "Your account has a hold on it. Please contact SABC to resolve.";
/**
 * Restriction code that are used in API.
 * * The Restriction table will have more restriction
 * * code, other than below mentioned codes.
 */
export enum RestrictionCode {
  // When institution report withdrawal for a FT course application,
  // "WTHD" restriction is added to student account or when institution
  // reports a change related to a FT application for unsuccessful
  // completion and the total number of unsuccessful weeks hits minimum 68,
  // the "SSR" restriction is added to the student account.
  //
  WTHD = "WTHD",
  // When institution report withdrawal for a FT course on a
  // student WITH a "WTHD" restriction , then "SSR" restriction
  // is added to the student account.
  SSR = "SSR ",
  // when institution report withdrawal or unsuccessful weeks
  // for a PT course application, "PTSSD" restriction is added to the student account.
  PTSSD = "PTSSD ",
}
