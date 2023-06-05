import { SetMetadata } from "@nestjs/common";

/**
 * Verify if the institution has access to student data of given student.
 */
export const INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY =
  "institution-has-student-data-access-key";

/**
 * Provide context that it's consumer must be
 * validated to have access to the student
 * and their application if present.
 */
export const HasStudentDataAccess = (
  studentIdParamName: string,
  applicationIdParamName?: string,
) =>
  SetMetadata(INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY, {
    studentIdParamName,
    applicationIdParamName,
  });

export interface HasStudentDataAccessParam {
  studentIdParamName: string;
  applicationIdParamName?: string;
}
