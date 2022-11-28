/**
 * Maximum allowed number of days that an MSFAA is considered
 * valid and could be reused for a new Student Application.
 * This period will be used to validate two scenarios.
 * 1 - For an exiting MSFAA, if the signDate is not outside the allowed period.
 * 2 - If the difference between the offering end date of a previously completed
 * application (with a signed MSFAA) and the offering start date of a new
 * Student Application being submitted is inside the allowed period.
 */
export const MAX_MSFAA_VALID_DAYS = 730;

/**
 * Email used during service account creation. It is the same across all the
 * environment and there is no actual use for it right now. Used because the email
 * is an mandatory field while creating a new user.
 */
export const SERVICE_ACCOUNT_DEFAULT_USER_EMAIL = "dev_sabc@gov.bc.ca";
