/**
 * While checking if the token need to be refreshed this is the amount os seconds, prior to
 * the token expiration, that a token will be considered close to be expiring and a new token
 * will be requested. For instance, if the token expiration time is 3min and this parameter is set
 * to 30 seconds, if a call to the keycloack "updateToken" method happen between 2:30-3:00
 * of the token life time, the token will be considered about to be expired a new one will be requested.
 */
export const MINIMUM_TOKEN_VALIDITY = 30;
/**
 * Renew auth token if expired. Check should happen every few seconds seconds.
 */
export const RENEW_AUTH_TOKEN_TIMER = 5000;
/**
 * COUNT_DOWN_TIMER_FOR_LOGOUT in seconds.
 */
export const COUNT_DOWN_TIMER_FOR_LOGOUT = 30;
/**
 * High estimated value to defined a max money amount for inputs that does not have a constrain defined.
 */
export const MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE = 100000000;
