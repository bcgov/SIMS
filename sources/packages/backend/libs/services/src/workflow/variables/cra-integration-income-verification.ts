/**
 * Created while starting the income verification for
 * partner/parents as an input variable to the sub process.
 */
export const SUPPORTING_USER_ID = "supportingUserId";
/**
 * Created while executing the income verification.
 * Declared inside cra-integration-income-verification.
 */
export const TAX_YEAR = "taxYear";
/**
 * Received as a input parameter while executing the income verification.
 * Input parameter for cra-integration-income-verification.
 */
export const REPORTED_INCOME = "reportedIncome";
/**
 * Created during the income verification workflow execution and
 * used to monitor if the response from the CRA was received.
 * Declared inside cra-integration-income-verification.
 */
export const INCOME_VERIFICATION_ID = "incomeVerificationId";
/**
 * While checking the income verification record to store the income information,
 * check if it is possible to execute the income verification on CRA.
 */
export const CAN_EXECUTE_INCOME_VERIFICATION = "canExecuteIncomeVerification";
/**
 * After an income verification is created this variable reports if the
 * response was already received from the ESDC.
 */
export const INCOME_VERIFICATION_COMPLETED = "incomeVerificationCompleted";
