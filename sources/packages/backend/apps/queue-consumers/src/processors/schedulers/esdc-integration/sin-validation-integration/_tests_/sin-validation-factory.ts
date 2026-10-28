import { Student } from "@sims/sims-db";
import {
  E2EDataSources,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";

/**
 * Saves a student with a SIN validation that is pending to be sent to ESDC.
 * @param db E2E data sources.
 * @param options student options.
 * - `firstName` student first name, null for students with a single name.
 * - `lastName` student last name.
 * - `gender` student gender.
 * - `birthDate` student birth date in the format YYYY-MM-DD.
 * @returns saved student with the pending SIN validation.
 */
export async function saveStudentWithPendingSINValidation(
  db: E2EDataSources,
  options?: {
    firstName?: string | null;
    lastName?: string;
    gender?: string;
    birthDate?: string;
  },
): Promise<Student> {
  const user = createFakeUser();
  if (options && "firstName" in options) {
    user.firstName = options.firstName;
  }
  if (options?.lastName) {
    user.lastName = options.lastName;
  }
  const student = await saveFakeStudent(
    db.dataSource,
    { user },
    {
      initialValue: { gender: options?.gender, birthDate: options?.birthDate },
    },
  );
  // The factory does not allow a null value for the validation result.
  await db.sinValidation.update(
    { id: student.sinValidation.id },
    { isValidSIN: null },
  );
  return student;
}
