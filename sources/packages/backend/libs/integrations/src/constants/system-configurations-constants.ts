/**
 * Amount of days before a disbursement schedule date is due that
 * it could be included in the e-Cert files to be sent to the
 * federal government.
 */
export const DISBURSEMENT_FILE_GENERATION_ANTICIPATION_DAYS = 5;

/**
 * File name of the ECE response file sent by institutions.
 */
export const ECE_RESPONSE_FILE_NAME = "CONR_008.TXT";

/**
 * Reason to be saved while declining an enrolment through ECE file integration.
 */
export const ECE_RESPONSE_COE_DECLINED_REASON =
  "A reason was not provided by your institution. Please speak to your Financial Aid Officer at your institution for details.";

/**
 * Name of the email attachment file sent in ECE Response processing notification.
 */
export const ECE_RESPONSE_ATTACHMENT_FILE_NAME =
  "processing_summary_report.txt";
