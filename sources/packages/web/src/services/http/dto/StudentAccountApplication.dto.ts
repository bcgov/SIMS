import { CreateStudentAPIInDTO } from "./Student.dto";

export interface CreateStudentAccountApplicationAPIInDTO {
  submittedData: unknown;
}

export interface StudentAccountApplicationSummaryAPIOutDTO {
  id: number;
  fullName: string;
  submittedDate: string;
}

export interface StudentAccountApplicationAPIOutDTO {
  id: number;
  submittedData: unknown;
}

/**
 * Represents all the data needed to create a student account and user.
 * Ministry will ensure that all the data is accurate and this payload will
 * contain the source of truth that must be used to update the existing user
 * and also create or update the student account as needed.
 */
export interface StudentAccountApplicationApprovalAPIInDTO
  extends CreateStudentAPIInDTO {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
}
