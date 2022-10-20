// Expected output: January, 9 2021
export const EXTENDED_DATE_FORMAT = "MMMM, D YYYY";
export const PIR_DENIED_REASON_OTHER_ID = 1;
export const COE_DENIED_REASON_OTHER_ID = 1;
export const INSTITUTION_TYPE_BC_PRIVATE = 2;
export const COE_WINDOW = 21;
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
// TODO: The value has been set to 4 from 3 to fix the ongoing file upload issue.
// TODO: On further investigation re-evaluate accordingly.
export const MAX_UPLOAD_PARTS = 4;

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
 * High estimated value to defined a max money amount for inputs that does not have a constrain defined.
 */
export const MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE = 999999;

/**
 * Allowed percentage of days of an offering that represents the maximum study breaks days allowed,
 * - 0.1 indicates 10%
 * - 0.5 indicates 50%
 * - 1.0 indicates 100%
 * For instance, for a offering with 200 days and considering a 10% configuration, the sum of all study
 * breaks days should not be greater than 20.
 */
export const OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD = 0.1;
/**
 * A study break period should not have less than the number of days defined by this const.
 */
export const OFFERING_STUDY_BREAK_MIN_DAYS = 6;
/**
 * A study break period should not exceed the amount of days defined by this const.
 * If exceeded, the extra days are considered ineligible days.
 */
export const OFFERING_STUDY_BREAK_MAX_DAYS = 21;
/**
 * Minimal value to an offering year of study.
 */
export const OFFERING_YEAR_OF_STUDY_MIN_VALUE = 1;
/**
 * Maximum value to an offering year of study.
 */
export const OFFERING_YEAR_OF_STUDY_MAX_VALUE = 9;
/**
 * Minimum value to an offering course load.
 */
export const OFFERING_COURSE_LOAD_MIN_VALUE = 20;
/**
 * Maximum value to an offering course load.
 */
export const OFFERING_COURSE_LOAD_MAX_VALUE = 59;
/**
 * Minimum amount of days to an offering study period.
 */
export const OFFERING_STUDY_PERIOD_MIN_DAYS = 42;
/**
 * Maximum amount of days to an offering study period.
 */
export const OFFERING_STUDY_PERIOD_MAX_DAYS = 365;
/**
 * Max number of parts (fields + files) allowed for a offering bulk upload.
 */
export const OFFERING_BULK_UPLOAD_MAX_UPLOAD_PARTS = 2;
/**
 * Max upload file size for an offering bulk upload (in bytes).
 */
export const OFFERING_BULK_UPLOAD_MAX_FILE_SIZE = 4194304;
