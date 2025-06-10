/**
 * Created while starting the 'Retrieve supporting info'
 * for parent/partners as an input variable to the sub process.
 */
export const SUPPORTING_USER_ID = "supportingUserId";
/**
 * Passed as parameters to determined the types of supporting
 * users and how many are needed as well.
 */
export const SUPPORTING_USERS_TYPES = "supportingUsersTypes";
/**
 * Supporting user type (Parent or Partner).
 */
export const SUPPORTING_USER_TYPE = "supportingUserType";
/**
 * JSON path to extract the full name of the supporting user
 * from the application dynamic data, when required, to identify
 * the supporting user (only used for parents right now).
 */
export const FULL_NAME_PROPERTY_FILTER = "fullNamePropertyFilter";
/**
 * Indicates if the student declared that the supporting user
 * is able to report their data to the Ministry.
 */
export const IS_ABLE_TO_REPORT = "isAbleToReport";
/**
 * Returned by the job that creates identifiable supporting users.
 */
export const CREATED_SUPPORTING_USER_ID = "createdSupportingUserId";
