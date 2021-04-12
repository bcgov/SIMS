import { IsNotEmpty } from "class-validator";

export class CreateApplicationDto {
  @IsNotEmpty()
  data: any;
}

export class GetApplicationDataDto {
  data: any;
}
