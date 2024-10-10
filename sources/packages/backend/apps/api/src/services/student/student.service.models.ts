import { UserInfo } from "../../types";
import { AddressInfo } from "@sims/sims-db";

/**
 * Information that must be provided
 * while creating a new student.
 */
export interface StudentInfo extends AddressInfo {
  phone: string;
  sinNumber: string;
  sinConsent: boolean;
  gender: string;
}

export interface StudentUserData {
  studentId: number;
  birthdate: string;
  lastName: string;
  givenNames: string;
  email: string;
  noteDescription?: string;
}

/**
 * Information needed from the user during student
 * creation process where user and student are updated
 * and/or created altogether.
 */
export type CreateStudentUserInfo = Pick<
  UserInfo,
  "userId" | "lastName" | "givenNames" | "email" | "birthdate"
> & {
  /**
   * Optional userName that must be provided to alow the user creation.
   * Required only when the userId is not present.
   */
  userName?: string;
};

/**
 * Information needed to compare students data to determined
 * if they are potentially the same student.
 */
export type UserInfoMatchData = Pick<
  CreateStudentUserInfo,
  "lastName" | "givenNames" | "birthdate"
>;
