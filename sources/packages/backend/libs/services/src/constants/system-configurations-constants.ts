import { Duration } from "zeebe-node";

/**
 * Default time that a message can wait, once it is delivery to the broker,
 * to find its correlated key.
 */
export const ZEEBE_PUBLISH_MESSAGE_DEFAULT_TIME_TO_LEAVE =
  Duration.seconds.of(10);

/**
 * Daily disbursement report name.
 */
export const DAILY_DISBURSEMENT_REPORT_NAME = "Daily_Disbursement_File";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time files while ECert request file is generated.
 */
export const ECERT_FULL_TIME_FILE_CODE = "PBC.EDU.FTECERTS.";
export const ECERT_PART_TIME_FILE_CODE = "PBC.EDU.PTCERTS.D";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time feedback file.
 */
export const ECERT_FULL_TIME_FEEDBACK_FILE_CODE = "EDU.PBC.FTECERTSFB.*";
export const ECERT_PART_TIME_FEEDBACK_FILE_CODE = "EDU.PBC.ECERTSFB.PT.*";

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
 * Group name used in the sequence control table to identify the ESDC
 * SIN validation generated files.
 */
export const ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME = "ESDC_SIN_VALIDATION";

/**
 * These constants are used to specify the filename code
 * created for Full-Time/ Part-Time files while MSFAA request file is generated.
 */
export const MSFAA_FULL_TIME_FILE_CODE = "PBC.EDU.MSFA.SENT.";
export const MSFAA_PART_TIME_FILE_CODE = "PBC.EDU.MSFA.SENT.PT.";

/**
 * Report the SFAS import progress every time that certain
 * amount of records are imported to avoid reporting the progress
 * all the time.
 */
export const SFAS_IMPORT_RECORDS_PROGRESS_REPORT_PACE = 1000;
