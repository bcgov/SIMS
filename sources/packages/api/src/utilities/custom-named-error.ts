/**
 * Creates an error that could receive a custom name
 * and allow easier identification while executing
 * the error handling.
 */
export class CustomNamedError extends Error {
  constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
}
