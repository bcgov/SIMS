/**
 * Payload for an API error with an unique error type
 * that allow to easily identify it.
 */
export class ApiProcessError<T = unknown> {
  /**
   * Creates a new API error payload.
   * @param message error message.
   * @param errorType unique error type.
   * @param objectInfo any helpful extra context.
   */
  constructor(
    public readonly message: string,
    public readonly errorType: string,
    public readonly objectInfo?: T,
  ) {}
}
