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
export const MAX_MSFAA_VALID_DAYS = 730;
// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
export const SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS = 10;
/**
 * Report the SFAS import progress every time that certain
 * amount of records are imported to avoid reporting the progress
 * all the time.
 */
export const SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE = 1000;
/**
 * Amount of days before a disbursement schedule date is due that
 * it could be included in the e-Cert files to be sent to the
 * federal government.
 */
export const DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS = 5;
/**
 * While importing the federal restrictions to our DB for processing
 * a series of bulk inserts are executed. The amount of each bulk
 * insert is defined by below number.
 * 200 = 1:20.134
 * 500 = 1:04.731
 * 1000 = 1:08.829
 */
export const FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT = 500;
/**
 * While importing the federal restrictions and it is detected that
 * some code is not present in the our DB yet, a new restriction
 * will be created using the below text.
 */
export const FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION =
  "Unidentified federal restriction";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time files while ECert request file is generated.
 */
export const ECERT_FULL_TIME_FILE_CODE = "PBC.EDU.FTECERTS.";
export const ECERT_PART_TIME_FILE_CODE = "PBC.EDU.PTCERTS.D";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time files while MSFAA request file is generated.
 */
export const MSFAA_FULL_TIME_FILE_CODE = "PBC.EDU.MSFA.SENT.";
export const MSFAA_PART_TIME_FILE_CODE = "PBC.EDU.MSFA.SENT.PT.";

/**
 * Group name used in the sequence control table to identify the ESDC
 * SIN validation generated files.
 */
export const ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME = "ESDC_SIN_VALIDATION";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time feedback file.
 */
export const ECERT_FULL_TIME_FEEDBACK_FILE_CODE = "EDU.PBC.FTECERTSFB.*";
export const ECERT_PART_TIME_FEEDBACK_FILE_CODE = "EDU.PBC.ECERTSFB.PT.*";

/**
 * These constants are used to specify the Template Id for email notification templates
 */
export const STUDENT_FILE_UPLOAD_TEMPLATE_ID =
  "3b37994f-464f-4eb0-ad30-84739fa82377";
/**
 * Email template used to notify the student when the Ministry uploads a file to his account.
 */
export const MINISTRY_FILE_UPLOAD_TEMPLATE_ID =
  "0b1abf34-d607-4f5c-8669-71fd4a2e57fe";

/**
 * Email used during service account creation. It is the same across all the
 * environment and there is no actual use for it right now. Used because the email
 * is an mandatory field while creating a new user.
 */
export const SERVICE_ACCOUNT_DEFAULT_USER_EMAIL = "dev_sabc@gov.bc.ca";

/**
 * For multipart forms, the max number of file fields.
 */
export const MAX_UPLOAD_FILES = 1;
/**
 * For multipart forms, the max number of parts (fields + files).
 * 3 means 'the file' + uniqueFileName + group.
 */
export const MAX_UPLOAD_PARTS = 3;

/**
 * Group name associated with the files uploaded by the Ministry
 * to the student account.
 */
export const MINISTRY_FILE_UPLOAD_GROUP_NAME = "Ministry communications";

/**
 * Daily disbursement report name.
 */
export const DAILY_DISBURSEMENT_REPORT_NAME = "Daily_Disbursement_File";

/**
 * This study break exceeds the 21 consecutive day threshold as outlined in StudentAid BC policy
 * - 0.1 indicates 10%
 * - 0.5 indicates 50%
 * - 1.0 indicates 100%
 */
export const OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD = 0.1;
/**
 * A study break period should not have less than the number of days defined by this const.
 */
export const OFFERING_STUDY_BREAK_MIN_DAYS = 6;
/**
 * A study break period should not exceed the amount of days defined by this const.
 */
export const OFFERING_STUDY_BREAK_CONSECUTIVE_DAYS_THRESHOLD = 21;
