import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsNotEmpty,
  IsPositive,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class ApplicationExceptionRequestAPIInDTO {
  @IsNotEmpty()
  @MaxLength(100)
  exceptionName: string;
}

export class CreateApplicationExceptionAPIInDTO {
  @IsPositive()
  applicationId: number;
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ApplicationExceptionRequestAPIInDTO)
  exceptionRequests: ApplicationExceptionRequestAPIInDTO[];
}
