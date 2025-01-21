import { CreateStudentAPIInDTO } from "@/services/http/dto";
import { Expose } from "class-transformer";

export interface CreateStudentAccountApplicationAPIInDTO {
  submittedData: unknown;
}

export interface StudentAccountApplicationSummaryAPIOutDTO {
  id: number;
  lastName: string;
  givenNames: string;
  dateOfBirth: string;
  submittedDate: Date;
}

export interface AESTStudentAccountApplicationAPIOutDTO {
  id: number;
  submittedData: unknown;
}

export interface StudentAccountApplicationAPIOutDTO {
  hasPendingApplication: boolean;
}

/**
 * Represents all the data needed to create a student account and user.
 * Ministry will ensure that all the data is accurate and this payload will
 * contain the source of truth that must be used to update the existing user
 * and also create or update the student account as needed.
 */
export class StudentAccountApplicationApprovalAPIInDTO extends CreateStudentAPIInDTO {
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Expose()
  email: string;
  @Expose()
  dateOfBirth: string;
  @Expose()
  identityProvider: string;
}
