export const OFFERING_START_DATE_ERROR = "OFFERING_START_DATE_ERROR";
export const INVALID_STUDY_DATES = "INVALID_STUDY_DATES";
export const OFFERING_INTENSITY_MISMATCH = "OFFERING_INTENSITY_MISMATCH";
export const INVALID_APPLICATION_NUMBER = "INVALID_APPLICATION_NUMBER";
export const APPLICATION_CHANGE_NOT_ELIGIBLE =
  "APPLICATION_CHANGE_NOT_ELIGIBLE";
export const FIRST_COE_NOT_COMPLETE = "FIRST_COE_NOT_COMPLETE";
export const INVALID_TUITION_REMITTANCE_AMOUNT =
  "INVALID_TUITION_REMITTANCE_AMOUNT";
// A STUDENT_APPLICATION_EXCEPTION_* referer to when a full-time/part-time
// student application has an exception to be verified (e.g. document to be reviewed).
export const STUDENT_APPLICATION_EXCEPTION_NOT_FOUND =
  "STUDENT_APPLICATION_EXCEPTION_NOTFOUND";
export const STUDENT_APPLICATION_EXCEPTION_INVALID_STATE =
  "STUDENT_APPLICATION_EXCEPTION_INVALID_STATE";
export const ACTIVE_STUDENT_RESTRICTION = "ACTIVE_STUDENT_RESTRICTION";

export const SIN_VALIDATION_RECORD_NOT_FOUND =
  "SIN_VALIDATION_RECORD_NOT_FOUND";
export const SIN_VALIDATION_RECORD_INVALID_OPERATION =
  "SIN_VALIDATION_RECORD_INVALID_OPERATION";
export const OFFERING_NOT_VALID = "OFFERING_NOT_VALID";
/**
 * An user is trying to be added to the institution when it is already present.
 */
export const INSTITUTION_USER_ALREADY_EXISTS =
  "INSTITUTION_USER_ALREADY_EXISTS";
/**
 * Only one legal signing authority is allowed per institution.
 * If there is an attempt to assign a second user as legal signing authority,
 * a exception with this code will be thrown.
 */
export const LEGAL_SIGNING_AUTHORITY_EXIST = "LEGAL_SIGNING_AUTHORITY_EXIST";
/**
 * An institution must have at least on admin user always present. If the user
 * permissions are edited in a way that the only administrator will be deactivated
 * or changed to a regular user, an exception will be thrown.
 */
export const INSTITUTION_MUST_HAVE_AN_ADMIN = "INSTITUTION_MUST_HAVE_AN_ADMIN";
/**
 * The BCeID user id was not able to be retrieved from the BCeID Web Service.
 */
export const BCEID_ACCOUNT_NOT_FOUND = "BCEID_ACCOUNT_NOT_FOUND";
