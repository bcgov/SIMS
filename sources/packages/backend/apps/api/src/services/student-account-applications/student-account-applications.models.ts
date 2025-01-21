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
  dateOfBirth: string;
}

/**
 * Data needed to update a user and also a student with the final
 * Ministry review of the student account application.
 */
export type StudentAccountApplicationApprovalModel = StudentInfo &
  StudentAccountApplicationCreateModel & {
    gender: string;
  };

/**
 * Dynamic data submitted by the student for the Ministry review while
 * requesting his identity verification.
 * The properties mapped here represent only the data that must be
 * consumed by the API, for instance, the sinConsent.
 */
export interface AccountApplicationSubmittedData {
  sinConsent: boolean;
}

/**
 * Data needed to obtain a list of student account applications
 * waiting to be assessed by the Ministry.
 */
export interface StudentAccountApplicationSummary {
  id: number;
  lastName: string;
  givenNames: string;
  birthDate: string;
  submittedDate: Date;
}
