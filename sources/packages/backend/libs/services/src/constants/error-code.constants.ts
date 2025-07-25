export const APPLICATION_NOT_FOUND = "APPLICATION_NOT_FOUND";
export const INVALID_APPLICATION_EDIT_STATUS =
  "INVALID_APPLICATION_EDIT_STATUS";
export const APPLICATION_STATUS_NOT_UPDATED = "APPLICATION_STATUS_NOT_UPDATED";
export const INVALID_OPERATION_IN_THE_CURRENT_STATUS =
  "INVALID_OPERATION_IN_THE_CURRENT_STATUS";
export const APPLICATION_MSFAA_ALREADY_ASSOCIATED =
  "APPLICATION_MSFAA_ALREADY_ASSOCIATED";
export const SUPPORTING_USER_NOT_FOUND = "SUPPORTING_USER_NOT_FOUND";
export const SUPPORTING_USER_FULL_NAME_NOT_RESOLVED =
  "SUPPORTING_USER_FULL_NAME_NOT_RESOLVED";
export const ASSESSMENT_NOT_FOUND = "ASSESSMENT_NOT_FOUND";
export const ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE =
  "ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE";
export const ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW =
  "ASSESSMENT_ALREADY_ASSOCIATED_TO_WORKFLOW";
export const ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW =
  "ASSESSMENT_ALREADY_ASSOCIATED_WITH_DIFFERENT_WORKFLOW";
export const DISBURSEMENT_SCHEDULES_ALREADY_CREATED =
  "DISBURSEMENT_SCHEDULES_ALREADY_CREATED";
export const GC_NOTIFY_PERMANENT_FAILURE_ERROR =
  "GC_NOTIFY_PERMANENT_FAILURE_ERROR";
export const APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR =
  "APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR";
export const INVALID_TUITION_REMITTANCE_AMOUNT =
  "INVALID_TUITION_REMITTANCE_AMOUNT";
export const ENROLMENT_NOT_FOUND = "ENROLMENT_NOT_FOUND";
export const ENROLMENT_ALREADY_COMPLETED = "ENROLMENT_ALREADY_COMPLETED";
export const ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE =
  "ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE";
export const ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD =
  "ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD";
export const FIRST_COE_NOT_COMPLETE = "FIRST_COE_NOT_COMPLETE";
export const UNEXPECTED_ERROR_DOWNLOADING_FILE =
  "UNEXPECTED_ERROR_DOWNLOADING_FILE";
export const ECE_DISBURSEMENT_DATA_NOT_VALID =
  "ECE_DISBURSEMENT_DATA_NOT_VALID";
export const FILE_PARSING_ERROR = "FILE_PARSING_ERROR";

/**
 * Used to cancel a database transaction started using the method as below.
 * @example
 * await myDataSource.transaction(async (transactionalEntityManager) => {
 *   // execute queries using transactionalEntityManager
 * })
 * @see https://typeorm.io/#/transactions
 */
export const DATABASE_TRANSACTION_CANCELLATION =
  "DATABASE_TRANSACTION_CANCELLATION";

export const DISBURSEMENT_SCHEDULE_NOT_UPDATED =
  "DISBURSEMENT_SCHEDULE_NOT_UPDATED";
