export const MORE_THAN_ONE_APPLICATION_DRAFT_ERROR =
  "ONLY_ONE_APPLICATION_DRAFT_PER_STUDENT_ALLOWED";

export class ApiProcessError {
  constructor(public message: string, public errorType: string) {}
}
