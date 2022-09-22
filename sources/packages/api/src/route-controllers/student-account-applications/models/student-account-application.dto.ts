import { Allow, IsNotEmptyObject } from "class-validator";
import { CreateStudentAPIInDTO } from "../../../route-controllers/student/models/student.dto";

export class CreateStudentAccountApplicationAPIInDTO {
  @IsNotEmptyObject()
  submittedData: unknown;
}

export class StudentAccountApplicationSummaryAPIOutDTO {
  id: number;
  fullName: string;
  submittedDate: Date;
}

export class AESTStudentAccountApplicationAPIOutDTO {
  id: number;
  submittedData: unknown;
}

export class StudentAccountApplicationAPIOutDTO {
  hasPendingApplication: boolean;
}

/**
 * Represents all the data needed to create a student account and user.
 * Ministry will ensure that all the data is accurate and this payload will
 * contain the source of truth that must be used to update the existing user
 * and also create or update the student account as needed.
 * !The data must be validate using a form.io dry run.
 */
export class StudentAccountApplicationApprovalAPIInDTO extends CreateStudentAPIInDTO {
  @Allow()
  firstName: string;
  @Allow()
  lastName: string;
  @Allow()
  email: string;
  @Allow()
  dateOfBirth: string;
  @Allow()
  gender: string;
}
