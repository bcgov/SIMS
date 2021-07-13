import { IsNotEmpty } from "class-validator";

export class CreateApplicationDto {
  @IsNotEmpty()
  data: any;
}

export class GetApplicationDataDto {
  data: any;
}

export interface ApplicationFileCreateDto {
  fileName: string;
  uniqueFileName: string;
  url: string;
  size: number;
  mimetype: string;
}
