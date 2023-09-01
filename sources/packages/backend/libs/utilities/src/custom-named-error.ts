/**
 * Creates an error that could receive a custom name
 * and allow easier identification while executing
 * the error handling.
 */
export class CustomNamedError extends Error {
  constructor(message: string, name: string, objectInfo?: unknown) {
    super(message);
    this.name = name;
    this.objectInfo = objectInfo;
  }
  readonly objectInfo: unknown;

  /**
   * Get a user friendly error message to be displayed
   * in the format "Message (ERROR_CODE).".
   * @returns user friendly error message.
   */
  getSummaryMessage(): string {
    if (!this.message) {
      // If message is not present just return the error name.
      return this.name;
    }
    // Remove the sentence period, if present, to have the error name appended.
    let message = this.message;
    if (message.endsWith(".")) {
      message = this.message.trim().slice(0, -1);
    }
    return `${message} (${this.name}).`;
  }
}
