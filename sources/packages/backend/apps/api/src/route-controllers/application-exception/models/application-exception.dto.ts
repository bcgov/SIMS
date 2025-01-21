import { Type } from "class-transformer";
import {
  ArrayMinSize,
  ArrayUnique,
  IsIn,
  IsNotEmpty,
  IsPositive,
  MaxLength,
  ValidateNested,
} from "class-validator";
import {
  ApplicationExceptionStatus,
  EXCEPTION_NAME_MAX_LENGTH,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";

export class ApplicationExceptionRequestAPIInDTO {
  @IsNotEmpty()
  @MaxLength(EXCEPTION_NAME_MAX_LENGTH)
  exceptionName: string;
}

export class CreateApplicationExceptionAPIInDTO {
  @IsPositive()
  applicationId: number;
  @ArrayMinSize(1)
  @ArrayUnique((exception) => exception.exceptionName)
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
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  noteDescription: string;
}

export class ApplicationExceptionRequestAPIOutDTO {
  exceptionName: string;
}

export class ApplicationExceptionAPIOutDTO {
  exceptionStatus: ApplicationExceptionStatus;
  submittedDate: Date;
  exceptionRequests: ApplicationExceptionRequestAPIOutDTO[];
}

export class DetailedApplicationExceptionAPIOutDTO extends ApplicationExceptionAPIOutDTO {
  noteDescription: string;
  assessedByUserName: string;
  assessedDate: Date;
}

export class ApplicationExceptionSummaryAPIOutDTO {
  applicationId: number;
  studentId: number;
  submittedDate: Date;
  givenNames: string;
  lastName: string;
  applicationNumber: string;
}
