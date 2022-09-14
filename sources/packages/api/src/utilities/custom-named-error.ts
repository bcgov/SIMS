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
}
