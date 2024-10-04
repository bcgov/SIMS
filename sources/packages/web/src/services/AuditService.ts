/**
 * Audit Service.
 */
export class AuditService {
  /**
   * Session storage var name to indicate that a login process has started for the user.
   */
  private static readonly USER_LOGIN_TRIGGERED = "userLoginTriggered";

  /**
   * Session storage var name to indicate that a user closed the browser without logging out.
   */
  private static readonly USER_CLOSED_BROWSER = "userClosedBrowser";

  /**
   * Session storage var name to indicate that a user session has timed out.
   */
  private static readonly USER_SESSION_TIMED_OUT = "userSessionTimedOut";

  /**
   * Removes variable from session storage that indicates that user session has timed out.
   */
  static resetUserSessionTimedOut() {
    sessionStorage.removeItem(this.USER_SESSION_TIMED_OUT);
  }

  /**
   * Checks if the variable in the session storage that indicates that the user session has timed out is set to "true".
   * @returns true if the variable in the session storage that indicates that the user session has timed out is set to "true".
   */
  static hasUserSessionTimedOut() {
    return sessionStorage.getItem(this.USER_SESSION_TIMED_OUT) === "true";
  }

  /**
   * Removes variable from local storage that indicates that user closed the browser.
   */
  static resetUserClosedBrowser() {
    localStorage.removeItem(this.USER_CLOSED_BROWSER);
  }

  /**
   * Checks if the variable in the local storage that indicates that the user has closed the browser is set to "true".
   * @returns true if the variable in the local storage  that indicates that the user has closed the browser is set to "true".
   */
  static hasUserClosedBrowser() {
    return localStorage.getItem(this.USER_CLOSED_BROWSER) === "true";
  }

  /**
   * Sets a variable with value "true" in the local storage to indicate that the user has closed the browser.
   */
  static userClosedBrowser() {
    localStorage.setItem(this.USER_CLOSED_BROWSER, "true");
  }

  /**
   * Sets a variable with value "true" in the session storage to indicate that the user login was triggered.
   */
  static userLoginTriggered() {
    sessionStorage.setItem(this.USER_LOGIN_TRIGGERED, "true");
  }

  /**
   * Checks if the variable in the session storage that indicates that the user login was triggered is set to "true".
   * @returns true if the variable in the session storage that indicates that the user login was triggered is set to "true".
   */
  static wasUserLoginTriggered() {
    return sessionStorage.getItem(this.USER_LOGIN_TRIGGERED) === "true";
  }

  /**
   * Removes variable from session storage that indicates that user login was triggered.
   */
  static resetLoginTriggered() {
    sessionStorage.removeItem(this.USER_LOGIN_TRIGGERED);
  }

  /**
   * Sets a variable with value "true" in the session storage to indicate that the user session has timed out.
   */
  static userSessionTimedOut() {
    sessionStorage.setItem(this.USER_SESSION_TIMED_OUT, "true");
  }
}
