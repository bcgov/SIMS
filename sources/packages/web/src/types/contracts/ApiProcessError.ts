export const MORE_THAN_ONE_APPLICATION_DRAFT_ERROR =
  "ONLY_ONE_APPLICATION_DRAFT_PER_STUDENT_ALLOWED";

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
