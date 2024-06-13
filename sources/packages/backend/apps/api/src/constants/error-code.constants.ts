export const OFFERING_START_DATE_ERROR = "OFFERING_START_DATE_ERROR";
export const INVALID_STUDY_DATES = "INVALID_STUDY_DATES";
export const OFFERING_INTENSITY_MISMATCH = "OFFERING_INTENSITY_MISMATCH";
export const MISSING_STUDENT_ACCOUNT = "MISSING_STUDENT_ACCOUNT";
export const INVALID_APPLICATION_NUMBER = "INVALID_APPLICATION_NUMBER";
/**
 * An application can have only one pending appeal at a time.
 */
export const APPLICATION_HAS_PENDING_APPEAL = "APPLICATION_HAS_PENDING_APPEAL";
export const APPLICATION_CHANGE_NOT_ELIGIBLE =
  "APPLICATION_CHANGE_NOT_ELIGIBLE";
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
/**
 * Program information request (PIR) errors.
 */
export const PIR_REQUEST_NOT_FOUND_ERROR = "PIR_REQUEST_NOT_FOUND_ERROR";
export const PIR_DENIED_REASON_NOT_FOUND_ERROR =
  "PIR_DENIED_REASON_NOT_FOUND_ERROR";
/**
 * Education program not found. Also used when the institution does not have access to it.
 */
export const EDUCATION_PROGRAM_NOT_FOUND = "EDUCATION_PROGRAM_NOT_FOUND";
/**
 * Some operation is being executed in a program in a moment that it is not expected.
 */
export const EDUCATION_PROGRAM_INVALID_OPERATION =
  "EDUCATION_PROGRAM_INVALID_OPERATION";

export const STUDENT_ACCOUNT_APPLICATION_NOT_FOUND =
  "STUDENT_ACCOUNT_APPLICATION_NOT_FOUND";
/**
 * The user is already present on DB, either because the same BCeID user is
 * trying to create an account application when it was already denied in the
 * past or because it is already added as another user, for instance,
 * an institution user.
 */
export const STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS =
  "STUDENT_ACCOUNT_APPLICATION_USER_ALREADY_EXISTS";

/**
 * While creating the student account, the same SIN was already associated
 * with other students.
 */
export const STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND =
  "STUDENT_ACCOUNT_CREATION_MULTIPLES_SIN_FOUND";
/**
 * While creating the student account, the same SIN was found associated with
 * an existing student and the personal data (e.g. first name, last name,
 * date of birth) does not match.
 */
export const STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA =
  "STUDENT_ACCOUNT_CREATION_FOUND_SIN_WITH_MISMATCH_DATA";
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
 * Duplication error. An offering with the same name, year of study, start date and end date was found.
 */
export const OFFERING_SAVE_UNIQUE_ERROR = "OFFERING_SAVE_UNIQUE_ERROR";
/**
 * Offering is trying to be updated but it is not in the correct state, either
 * due to an expected status or any other condition. For instance, an offering
 * cannot have certain data update if it is associated with an assessment.
 */
export const OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE =
  "OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE";

export const STUDENT_SIN_CONSENT_NOT_CHECKED =
  "STUDENT_SIN_CONSENT_NOT_CHECKED";
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
 * Institution location not valid.
 */
export const INSTITUTION_LOCATION_NOT_VALID = "INSTITUTION_LOCATION_NOT_VALID";

/**
 * Request for disability not allowed.
 */
export const DISABILITY_REQUEST_NOT_ALLOWED = "DISABILITY_REQUEST_NOT_ALLOWED";
/**
 * Offering program year mismatch.
 */
export const OFFERING_PROGRAM_YEAR_MISMATCH = "OFFERING_PROGRAM_YEAR_MISMATCH";
/**
 * Offering does not belong to the location.
 */
export const OFFERING_DOES_NOT_BELONG_TO_LOCATION =
  "OFFERING_DOES_NOT_BELONG_TO_LOCATION";
/**
 * Education program is not active.
 */
export const EDUCATION_PROGRAM_IS_NOT_ACTIVE =
  "EDUCATION_PROGRAM_IS_NOT_ACTIVE";
/**
 * Education program is expired.
 * Education programs that need to be approved by the Ministry have an effective end date.
 * Auto-approved programs do not have an effective end date set and do not expire.
 */
export const EDUCATION_PROGRAM_IS_EXPIRED = "EDUCATION_PROGRAM_IS_EXPIRED";
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
 * 3. Number of records in the footer does not match the no of data records.
 */
export const APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR =
  "APPLICATION_WITHDRAWAL_INVALID_TEXT_FILE_ERROR";
/**
 * One or more application withdrawal business validation errors have occurred.
 */
export const APPLICATION_WITHDRAWAL_VALIDATION_ERROR =
  "APPLICATION_WITHDRAWAL_VALIDATION_ERROR";
