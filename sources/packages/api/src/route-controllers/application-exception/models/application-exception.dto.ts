import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsIn,
  IsNotEmpty,
  IsPositive,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ApplicationExceptionStatus } from "../../../database/entities";

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

export class UpdateApplicationExceptionAPIInDTO {
  @IsIn([
    ApplicationExceptionStatus.Approved,
    ApplicationExceptionStatus.Declined,
  ])
  exceptionStatus: ApplicationExceptionStatus;
  @IsNotEmpty()
  @MaxLength(1000)
  noteDescription: string;
}

export class ApplicationExceptionRequestAPIOutDTO {
  exceptionName: string;
}

export class ApplicationExceptionAPIOutDTO {
  exceptionStatus: ApplicationExceptionStatus;
  noteDescription: string;
  exceptionRequests: ApplicationExceptionRequestAPIOutDTO[];
}
