// Expected output: January, 9 2021
export const EXTENDED_DATE_FORMAT = "MMMM, D YYYY";
export const PIR_DENIED_REASON_OTHER_ID = 1;
export const COE_DENIED_REASON_OTHER_ID = 1;
export const INSTITUTION_TYPE_BC_PRIVATE = 2;
export const COE_WINDOW = 21;
/**
 * Maximum allowed number of days that an MSFAA is considered
 * valid and could be reused for a new Student Application.
 * This period will be used to validate two scenarios.
 * 1 - For an exiting MSFAA, if the signDate is not outside the allowed period.
 * 2 - If the difference between the offering end date of a previously completed
 * application (with a signed MSFAA) and the offering start date of a new
 * Student Application being submitted is inside the allowed period.
 */
export const MAX_MFSAA_VALID_DAYS = 730;
// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
export const SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS = 10;
