import { IsObject } from "class-validator";

export class CreateStudentAccountApplicationAPIInDTO {
  @IsObject()
  submittedData: unknown;
}
