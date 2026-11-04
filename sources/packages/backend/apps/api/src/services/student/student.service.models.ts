import { Role } from "../../auth";
import { UserInfo } from "../../types";
import { AddressInfo, NoteType } from "@sims/sims-db";

/**
 * Information that must be provided
 * while creating a new student.
 */
export interface StudentInfo extends AddressInfo {
  email: string;
  phone: string;
  sinNumber: string;
  sinConsent: boolean;
  gender: string;
}

export interface StudentUserData {
  studentId: number;
  birthdate: string;
  lastName: string;
  givenNames?: string;
  /**
   * User e-mail. When not provided, the e-mail is not updated
   * (e.g. BCSC token sync, since the e-mail is maintained by the student).
   */
  email?: string;
  noteDescription: string;
}

/**
 * Information needed from the user during student
 * creation process where user and student are updated
 * and/or created altogether.
 */
export type CreateStudentUserInfo = Pick<
  UserInfo,
  "userId" | "lastName" | "givenNames" | "birthdate"
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

/**
 * Map note categories to the user roles, only if there is some
 * authorization to be applied to the role.
 */
export const STUDENT_NOTE_USER_ROLES_MAP = new Map<NoteType, Role>([
  [NoteType.StudentAppeal, Role.StudentApproveDeclineAppeals],
  [NoteType.StudentForm, Role.StudentApproveDeclineForms],
]);
