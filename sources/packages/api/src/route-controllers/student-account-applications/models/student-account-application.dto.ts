import { IsObject } from "class-validator";

export class CreateStudentAccountApplicationAPIInDTO {
  @IsObject()
  submittedData: unknown;
}

export class StudentAccountApplicationSummaryAPIOutDTO {
  id: number;
  fullName: string;
  submittedDate: string;
}

export class StudentAccountApplicationAPIOutDTO {
  id: number;
  submittedData: unknown;
}
