/**
 * Restriction codes that are used in API.
 * * The Restriction table will have more restriction
 * * codes, other than below mentioned codes.
 */
export enum RestrictionCode {
  /**
   * When an institution report withdrawal for a FT course application,
   * "WTHD" restriction is added to student account or when institution
   * reports a change related to a FT application for unsuccessful
   * completion and the total number of unsuccessful weeks hits minimum 68,
   * the "SSR" restriction is added to the student account.
   */
  WTHD = "WTHD",
  /**
   * When an institution report withdrawal for a FT course on a
   * student WITH a "WTHD" restriction , then "SSR" restriction
   * is added to the student account.
   */
  SSR = "SSR",
  /**
   * when an institution report withdrawal or unsuccessful weeks
   * for a PT course application, "PTSSR" restriction is added to the student account.
   */
  PTSSR = "PTSSR",
  /**
   * When a student has a temporary SIN and applies for a full-time/part-time application
   * this restriction is applied case the SIN expiry date is before the offering end date.
   */
  SINF = "SINF",
}
