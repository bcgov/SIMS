export const OFFERING_INTENSITY_MISMATCH = "OFFERING_INTENSITY_MISMATCH";
export const PIR_OR_DATE_OVERLAP_ERROR = "PIR_OR_DATE_OVERLAP_ERROR";
export const ACTIVE_STUDENT_RESTRICTION = "ACTIVE_STUDENT_RESTRICTION";
export const MISSING_STUDENT_ACCOUNT = "MISSING_STUDENT_ACCOUNT";
export const APPLICATION_CHANGE_NOT_ELIGIBLE =
  "APPLICATION_CHANGE_NOT_ELIGIBLE";
export const INVALID_APPLICATION_NUMBER = "INVALID_APPLICATION_NUMBER";
export const FIRST_COE_NOT_COMPLETE = "FIRST_COE_NOT_COMPLETE";
export const INVALID_TUITION_REMITTANCE_AMOUNT =
  "INVALID_TUITION_REMITTANCE_AMOUNT";
/**
 * A user is trying to be added to the institution when it is already present.
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
/**
 * The user is already present on DB, either because the same BCeID user is
 * trying to create an account application when it was already denied in the
 * past or because it is already added as another user, for instance,
 * an institution user.
 */
export const STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS =
  "STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS";
/**
 * An error was found during the offering validation and the process
 * must be stopped. Every offering validation will generate an error but
 * some errors are classified as warnings and therefore are not considered
 * critical, which means that critical errors are the only ones that will
 * cause the process to be interrupted.
 */
export const OFFERING_VALIDATION_CRITICAL_ERROR =
  "OFFERING_VALIDATION_CRITICAL_ERROR";
/**
 * Error happen during CSV content parse.
 */
export const OFFERING_VALIDATION_CSV_PARSE_ERROR =
  "OFFERING_VALIDATION_CSV_PARSE_ERROR";
/**
 * The CSV content to perform the offering bulk insert is not in the
 * expected format and cannot be parsed.
 */
export const OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR =
  "OFFERING_VALIDATION_CSV_CONTENT_FORMAT_ERROR";
/**
 * Some error happen with one or more offerings being created and
 * the entire process was aborted. This error happens during the offerings
 * database inserts.
 */
export const OFFERING_CREATION_CRITICAL_ERROR =
  "OFFERING_CREATION_CRITICAL_ERROR";
