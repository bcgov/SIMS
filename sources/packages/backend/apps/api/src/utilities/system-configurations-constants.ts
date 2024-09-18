import { RestrictionCode } from "@sims/services";

export const PIR_DENIED_REASON_OTHER_ID = 1;
// Timeout to handle the worst-case scenario where the commit/rollback
// was not executed due to a possible catastrophic failure.
export const SUPPORTING_USERS_TRANSACTION_IDLE_TIMEOUT_SECONDS = 10;
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
 * High estimated value to defined a max money amount for inputs that does not have a constrain defined.
 */
export const MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE = 100000000;
/**
 * Maximum allowable amount for offering tuition, books and supplies, mandatory fees and exceptional expenses.
 */
export const MAX_ALLOWED_OFFERING_AMOUNT = 100000;
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
export const OFFERING_BULK_UPLOAD_MAX_FILE_SIZE = 15728640;
/**
 * Max number of parts (fields + files) allowed for a application bulk withdrawal.
 */
export const APPLICATION_BULK_WITHDRAWAL_MAX_UPLOAD_PARTS = 2;
/**
 * Max upload file size for an application bulk withdrawal (in bytes).
 */
export const APPLICATION_BULK_WITHDRAWAL_UPLOAD_MAX_FILE_SIZE = 15728640;
/**
 * Expected length of the award value code.
 */
export const AWARD_VALUE_CODE_LENGTH = 4;

/**
 * For a scholastic standing of type "Student did not complete program" the number
 * of unsuccessful weeks must also be reported, along the time if the amount of
 * weeks reaches the value in the const, a restriction will be generated.
 */
export const SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS = 68;
/**
 * Maximum recent loan balance records considered essential for
 * the loan balance statement.
 */
export const MAXIMUM_ESSENTIAL_LOAN_BALANCE_RECORDS = 12;
/**
 * Represents the count of the number of times an application is edited to trigger a notification to be sent to the ministry.
 */
export const APPLICATION_EDIT_COUNT_TO_SEND_NOTIFICATION = 5;
/**
 * Minimum amount of funded weeks required for a full time offering study period.
 */
export const OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_FULL_TIME = 12;
/**
 * Minimum amount of funded weeks required for a part time offering study period.
 */
export const OFFERING_STUDY_PERIOD_MIN_FUNDED_WEEKS_PART_TIME = 6;

/**
 * Part time scholastic standing restrictions.
 */
export const PART_TIME_SCHOLASTIC_STANDING_RESTRICTIONS: RestrictionCode[] = [
  RestrictionCode.PTSSR,
  RestrictionCode.PTWTHD,
];
