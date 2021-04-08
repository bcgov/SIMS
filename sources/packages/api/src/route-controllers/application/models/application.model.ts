import { IsNotEmpty } from "class-validator";

export class CreateApplicationDto {
  @IsNotEmpty()
  data: any;
}
