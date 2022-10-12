/**
 * Created while starting the assessment-gateway workflow.
 * Workflows: assessment-gateway.
 * Type: Global variable.
 */
export const ASSESSMENT_ID = "assessmentId";
/**
 * Created while loading the assessment data.
 * Workflows: assessment-gateway.
 * Type: Global variable.
 */
export const APPLICATION_ID = "applicationId";
/**
 * Created while creating supporting users for
 * partner/parents income verifications.
 * Workflows: assessment-gateway, cra-integration-income-verification.
 * Type: Global variable.
 */
export const SUPPORTING_USER_ID = "supportingUserId";
/**
 * Provided while creating the supporting users.
 * Workflows: supporting-user-information-request.
 * Local variable declared at the task level only.
 */
export const SUPPORTING_USERS_TYPES = "supportingUsersTypes";
/**
 * Created while executing the income verification.
 * Workflows: cra-integration-income-verification.
 * Declared inside cra-integration-income-verification.
 */
export const TAX_YEAR = "taxYear";
/**
 * Received as a input parameter while executing the income verification.
 * Workflows: cra-integration-income-verification.
 * Input parameter for cra-integration-income-verification.
 */
export const REPORTED_INCOME = "reportedIncome";
