/**
 * Restriction codes that are used in applications (API, Workers, Queue-Consumers).
 * * The Restriction table will have more restriction codes other than below mentioned codes.
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
   * When an institution report withdrawal or unsuccessful weeks
   * for a PT course application, "PTWTHD" restriction is added to the student account.
   */
  PTWTHD = "PTWTHD",
  /**
   * When a student has a temporary SIN and applies for a full-time/part-time application
   * this restriction is applied case the SIN expiry date is before the offering end date.
   */
  SINF = "SINF",
  /**
   * BCSL Lifetime Maximum is the student's cumulative full-time BCSL awards received over
   * a lifetime. This restriction is added to a student when they reach BC lifetime maximum
   * reached. It is calculated during E-cert.
   */
  BCLM = "BCLM",
}
