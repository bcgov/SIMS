import { StudentContact } from "./studentContact";

export interface StudentInfo {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  contact: StudentContact;
}
