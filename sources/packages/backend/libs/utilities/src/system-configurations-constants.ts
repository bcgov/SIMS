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

/**
 * Email used during service account creation. It is the same across all the
 * environment and there is no actual use for it right now. Used because the email
 * is an mandatory field while creating a new user.
 */
export const SERVICE_ACCOUNT_DEFAULT_USER_EMAIL = "dev_sabc@gov.bc.ca";
/**
 * Minimum value amount to generate an overaward for a federal loan.
 */
export const MIN_CANADA_LOAN_OVERAWARD = 250;

/**
 * Default lifetime of ORM cache in milliseconds.
 */
export const ORM_CACHE_LIFETIME = 10 * 60 * 1000;

/**
 * Redis command timeout of the ORM cache in milliseconds.
 */
export const ORM_CACHE_REDIS_COMMAND_TIMEOUT = 5 * 1000;

/**
 * Maximum number of open connections that
 * are allowed for connection pool.
 */
export const CONNECTION_POOL_MAX_CONNECTIONS = 10;
/**
 * Maximum time that a connection request can wait
 * to get the database connection.
 */
export const CONNECTION_REQUEST_TIMEOUT = 120000;

/**
 * Redis retry interval to retry connection
 * when a connection cannot be established to redis.
 *
 * Ref for standalone: https://github.com/redis/ioredis/tree/v4#auto-reconnect
 *
 * Ref for cluster: https://github.com/redis/ioredis/tree/v4#cluster
 */
export const ORM_CACHE_REDIS_RETRY_INTERVAL = 60 * 1000;

/**
 * Minimum number of days from COE approval date to the disbursement date.
 */
export const COE_WINDOW = 21;

export const COE_DENIED_REASON_OTHER_ID = 1;

export const UTF8_BYTE_ORDER_MARK = [239, 187, 191];

/**
 * Number of days from the end date of the offering to send the PD/PPD notification.
 */
export const DISABILITY_NOTIFICATION_DAYS_LIMIT = 56;

/**
 * latin1 default encoding for files.
 */
export const FILE_DEFAULT_ENCODING = "latin1";
