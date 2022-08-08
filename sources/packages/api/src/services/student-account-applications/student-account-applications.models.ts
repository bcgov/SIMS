import { StudentInfo } from "../student/student.service.models";

/**
 * Data needed to create the user and also
 * the dynamic data that represents the student profile
 * to be assessed by the Ministry.
 * The properties explicity declared represents the
 * information that must be used to create the user that
 * later will be used to be linked to the student.
 */
export interface StudentAccountApplicationCreateModel {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Data needed to update a user and also a student with the final
 * Ministry review of the student account application.
 */
export type StudentAccountApplicationApprovalModel = StudentInfo &
  StudentAccountApplicationCreateModel & {
    dateOfBirth: string;
    gender: string;
  };
