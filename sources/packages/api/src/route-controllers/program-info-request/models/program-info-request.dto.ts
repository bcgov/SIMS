import { IsInt, IsNotEmpty, Min } from "class-validator";

export class CompleteProgramInfoRequestDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  offeringId: number;
}
