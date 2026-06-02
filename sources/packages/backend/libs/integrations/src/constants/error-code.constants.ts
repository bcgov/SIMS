export const DOCUMENT_NUMBER_NOT_FOUND = "DOCUMENT_NUMBER_NOT_FOUND";

/**
 * Error code used when there is an CAS authentication error.
 */
export const CAS_AUTH_ERROR = "CAS_AUTH_ERROR";
/**
 * CAS bad request error.
 */
export const CAS_BAD_REQUEST = "CAS_BAD_REQUEST";

/**
 * IER12 error code used when the modified since date provided in the job data is not a valid date.
 */
export const IER12_MODIFIED_SINCE_DATE_INVALID =
  "Job data modifiedSince must be a valid ISO date (YYYY-MM-DD).";

/**
 * IER12 error code used when the modified since date provided in the job data is more than one year in the past.
 */
export const IER12_MODIFIED_SINCE_DATE_OVER_ONE_YEAR =
  "Job data modifiedSince cannot be more than one year in the past.";

/**
 * IER12 error code used when the institution code provided in the job data is not exactly 4 characters.
 */
export const IER12_INSTITUTION_CODE_INVALID =
  "Job data institutionCode must be exactly 4 characters.";
