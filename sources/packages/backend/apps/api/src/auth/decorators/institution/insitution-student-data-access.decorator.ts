import { SetMetadata } from "@nestjs/common";

// Verify if the institution has access to student data of given student.
export const INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY =
  "institution-has-student-data-access-key";
export const HasStudentDataAccess = (studentIdParamName: string) =>
  SetMetadata(INSTITUTION_HAS_STUDENT_DATA_ACCESS_KEY, studentIdParamName);
