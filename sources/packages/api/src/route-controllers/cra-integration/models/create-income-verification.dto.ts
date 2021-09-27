import { IsInt, Min } from "class-validator";

export class CreateIncomeVerificationDto {
  @IsInt()
  @Min(1)
  applicationId: number;
  @IsInt()
  @Min(2000)
  taxYear: number;
  @IsInt()
  @Min(0)
  reportedIncome: number;
}
