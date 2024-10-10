/**
 * Session storage var name to indicate that a login process has started for the user.
 */
const USER_LOGIN_TRIGGERED = "userLoginTriggered";

/**
 * Session storage var name to indicate that a user closed the browser without logging out.
 */
const USER_CLOSED_BROWSER = "userClosedBrowser";

/**
 * Session storage var name to indicate that a user session has timed out.
 */
const USER_SESSION_TIMED_OUT = "userSessionTimedOut";

/**
 * Audit Service.
 */
export class AuditService {
  /**
   * Removes variable from session storage that indicates that user session has timed out.
   */
  static resetUserSessionTimedOut() {
    sessionStorage.removeItem(USER_SESSION_TIMED_OUT);
  }

  /**
   * Checks if the variable in the session storage that indicates that the user session has timed out is set to "true".
   * @returns true if the variable in the session storage that indicates that the user session has timed out is set to "true".
   */
  static hasUserSessionTimedOut() {
    return sessionStorage.getItem(USER_SESSION_TIMED_OUT) === "true";
  }

  /**
   * Removes variable from local storage that indicates that user closed the browser.
   */
  static resetUserClosedBrowser() {
    localStorage.removeItem(USER_CLOSED_BROWSER);
  }

  /**
   * Checks if the variable in the local storage that indicates that the user has closed the browser is set to "true".
   * @returns true if the variable in the local storage  that indicates that the user has closed the browser is set to "true".
   */
  static hasUserClosedBrowser() {
    return localStorage.getItem(USER_CLOSED_BROWSER) === "true";
  }

  /**
   * Sets a variable with value "true" in the local storage to indicate that the user has closed the browser.
   */
  static userClosedBrowser() {
    localStorage.setItem(USER_CLOSED_BROWSER, "true");
  }

  /**
   * Sets a variable with value "true" in the session storage to indicate that the user login was triggered.
   */
  static userLoginTriggered() {
    sessionStorage.setItem(USER_LOGIN_TRIGGERED, "true");
  }

  /**
   * Checks if the variable in the session storage that indicates that the user login was triggered is set to "true".
   * @returns true if the variable in the session storage that indicates that the user login was triggered is set to "true".
   */
  static wasUserLoginTriggered() {
    return sessionStorage.getItem(USER_LOGIN_TRIGGERED) === "true";
  }

  /**
   * Removes variable from session storage that indicates that user login was triggered.
   */
  static resetLoginTriggered() {
    sessionStorage.removeItem(USER_LOGIN_TRIGGERED);
  }

  /**
   * Sets a variable with value "true" in the session storage to indicate that the user session has timed out.
   */
  static userSessionTimedOut() {
    sessionStorage.setItem(USER_SESSION_TIMED_OUT, "true");
  }
}
