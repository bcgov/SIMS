/**
 * Restriction codes that are used in applications (API, Workers, Queue-Consumers).
 * * The Restriction table will have more restriction codes other than below mentioned codes.
 */
export enum RestrictionCode {
  /**
   * When an institution report withdrawal for a full-time course application,
   * "WTHD" restriction is added to student account if one is not already present.
   */
  WTHD = "WTHD",
  /**
   * When an institution report withdrawal for a full-time course on a
   * student WITH a "WTHD" restriction, then "SSR" restriction
   * is added to the student account.
   */
  SSR = "SSR",
  /**
   * When an institution reports withdrawal for a full-time course and
   * the student already has or had an "SSR" restriction, an "SSRN" restriction
   * is added to the student's account.
   */
  SSRN = "SSRN",
  /**
   * when an institution report withdrawal or unsuccessful weeks
   * for a part-time course application, "PTSSR" restriction is added to the student account.
   */
  PTSSR = "PTSSR",
  /**
   * When an institution report withdrawal or unsuccessful weeks
   * for a part-time course application, "PTWTHD" restriction is added to the student account.
   */
  PTWTHD = "PTWTHD",
  /**
   * When a student has a temporary SIN and applies for a full-time/part-time application
   * this restriction is applied case the SIN expiry date is before the offering end date.
   */
  SINR = "SINR",
  /**
   * BCSL Lifetime Maximum is the student's cumulative full-time BCSL awards received over
   * a lifetime. This restriction is added to a student when they reach BC lifetime maximum
   * reached. It is calculated during E-cert.
   */
  BCLM = "BCLM",
  /**
   * Student has declared bankruptcy on their application.
   */
  E2 = "E2",
  /**
   * Bankruptcy has been filed and there is a hold on federal and BC funding.
   */
  RB = "RB",
  /**
   * Application processing hold restriction to prevent application completion while
   * potential partial match exists.
   */
  HOLD = "HOLD",
  /**
   * Aviation restriction which prevents a student from being funded
   * for the credential commercial pilot program again in the future.
   */
  AVCP = "AVCP",
  /**
   * Aviation restriction prevents a student from being funded
   * for the credential instructor's rating again in the future.
   */
  AVIR = "AVIR",
  /**
   * Aviation restriction prevents a student from being funded
   * for the credential endorsements again in the future.
   */
  AVEN = "AVEN",
  /**
   * Legacy aviation restriction added from SFAS.
   */
  SFAS_AV = "SFAS_AV",
  /**
   * Institution block remittance request restriction.
   */
  REMIT = "REMIT",
}

/**
 * The party (student or institution) who is restricted.
 */
export enum RestrictedParty {
  /**
   * Restriction is applied to a student.
   */
  Student = "Student",
  /**
   * Restriction is applied to an institution.
   */
  Institution = "Institution",
}
