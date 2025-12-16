/**
 * Amount of days before a disbursement schedule date is due that
 * it could be included in the e-Cert files to be sent to the
 * federal government.
 */
export const DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS = 5;

/**
 * Reason to be saved while declining an enrolment through ECE file integration.
 */
export const ECE_RESPONSE_COE_DECLINED_REASON =
  "A reason was not provided by your institution. Please speak to your Financial Aid Officer at your institution for details.";

/**
 * Name of the email attachment file sent in ECE Response processing notification.
 */
export const ECE_RESPONSE_ATTACHMENT_FILE_NAME =
  "Processing_Summary_Report.txt";

/**
 * Regex to split a file content string with line breaks.
 */
export const LINE_BREAK_SPLIT_REGEX = /\r\n|\n\r|\n|\r/;
/**
 * Application changes report file name prefix.
 */
export const APPLICATION_CHANGES_REPORT_PREFIX = "PBC.EDU.APPCHANGES";

/**
 * SFTP directory name used to archive files.
 */
export const SFTP_ARCHIVE_DIRECTORY = "Archive";

/**
 * Initial date for the SIMS to SFAS bridge first ever execution.
 */
export const SIMS_TO_SFAS_BRIDGE_FILE_INITIAL_DATE = new Date("2024-01-01");

/**
 * Group name used to store T4A files into the student account.
 */
export const T4A_FILE_PREFIX = "T4A";

/**
 * Default maximum number of file uploads per batch for a T4A upload enqueuer job.
 */
export const DEFAULT_MAX_FILE_UPLOADS_PER_BATCH = 100;

/**
 * Temporary configuration for the T4A SFTP IN folder.
 * TODO: Move to an environment variable.
 */
export const T4A_SFTP_IN_FOLDER = "IN/T4A";
