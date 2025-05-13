export const OFFERING_INTENSITY_MISMATCH = "OFFERING_INTENSITY_MISMATCH";
export const ACTIVE_STUDENT_RESTRICTION = "ACTIVE_STUDENT_RESTRICTION";
export const MISSING_STUDENT_ACCOUNT = "MISSING_STUDENT_ACCOUNT";
export const MISSING_USER_ACCOUNT = "MISSING_USER_ACCOUNT";
export const MISSING_GROUP_ACCESS = "MISSING_GROUP_ACCESS";
export const MISSING_USER_INFO = "MISSING_USER_INFO";
export const APPLICATION_CHANGE_NOT_ELIGIBLE =
  "APPLICATION_CHANGE_NOT_ELIGIBLE";
/**
 * An application can have only one pending appeal at a time.
 */
export const APPLICATION_HAS_PENDING_APPEAL = "APPLICATION_HAS_PENDING_APPEAL";
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
/**
 * Duplicate location code for the institution.
 */
export const DUPLICATE_INSTITUTION_LOCATION_CODE =
  "DUPLICATE_INSTITUTION_LOCATION_CODE";
/**
 * Duplicate SABC code for the institution.
 */
export const DUPLICATE_SABC_CODE = "DUPLICATE_SABC_CODE";
/**
 * Request for disability not allowed.
 */
export const DISABILITY_REQUEST_NOT_ALLOWED = "DISABILITY_REQUEST_NOT_ALLOWED";
/**
 * Provided study dates is overlapping with the existing study periods.
 */
export const STUDY_DATE_OVERLAP_ERROR = "STUDY_DATE_OVERLAP_ERROR";
/**
 * The text content to perform the application withdrawal is not in the
 * expected format and cannot be parsed.
 */
export const APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR =
  "APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR";
/**
 * The text content has invalid content, either
 * 1. Invalid Header record type.
 * 2. Invalid Footer record type.
 * 3. Number of records in the footer does not match the number of data records.
 */
export const APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR =
  "APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR";
/**
 * The text content has one or more validation errors.
 */
export const APPLICATION_WITHDRAWAL_VALIDATION_ERROR =
  "APPLICATION_WITHDRAWAL_VALIDATION_ERROR";

/**
 * File has not been scanned yet and cannot be downloaded.
 */
export const FILE_HAS_NOT_BEEN_SCANNED_YET = "FILE_HAS_NOT_BEEN_SCANNED_YET";

/**
 * File has been scanned and a virus was detected.
 */
export const VIRUS_DETECTED = "VIRUS_DETECTED";

/**
 * Invalid beta user.
 */
export const INVALID_BETA_USER = "INVALID_BETA_USER";

/**
 * Bypass for student restriction already exists.
 */
export const ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS =
  "ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS";

/**
 * Student restriction is not active.
 */
export const STUDENT_RESTRICTION_IS_NOT_ACTIVE =
  "STUDENT_RESTRICTION_IS_NOT_ACTIVE";

/**
 * Student restriction not found.
 */
export const STUDENT_RESTRICTION_NOT_FOUND = "STUDENT_RESTRICTION_NOT_FOUND";

/**
 * Student application is invalid state for application restriction bypass creation.
 */
export const APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION =
  "APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION";

/**
 * Application restriction bypass not found.
 */
export const APPLICATION_RESTRICTION_BYPASS_NOT_FOUND =
  "APPLICATION_RESTRICTION_BYPASS_NOT_FOUND";

/**
 * Application restriction bypass is not active.
 */
export const APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE =
  "APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE";

/**
 * An application change request is already in progress for the student.
 */
export const APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS =
  "APPLICATION_CHANGE_REQUEST_ALREADY_IN_PROGRESS";

/**
 * An application change request is cancelled by the student.
 */
export const APPLICATION_CHANGE_CANCELLED_BY_STUDENT =
  "APPLICATION_CHANGE_CANCELLED_BY_STUDENT";
