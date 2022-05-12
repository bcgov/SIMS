import { SetMetadata } from "@nestjs/common";

export const REQUIRES_STUDENT_ACCOUNT_KEY = "requires-student-account-key";
/**
 * Specifies when a user requires a created student account to have access to a route.
 * If the decorator is present it means that the student account will be required by default.
 * @param required if true(default), the student account must be present.
 */
export const RequiresStudentAccount = (required = true) =>
  SetMetadata(REQUIRES_STUDENT_ACCOUNT_KEY, required);
