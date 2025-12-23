import {
  AssessmentTriggerType,
  DisbursementOverawardOriginType,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import {
  AWARD_VALUE_CODE_LENGTH,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
} from "../../../utilities";
import {
  Length,
  Max,
  Min,
  NotEquals,
  IsNotEmpty,
  MaxLength,
} from "class-validator";

export class OverawardBalanceAPIOutDTO {
  overawardBalanceValues: Record<string, number>;
}

export class StudentsOverawardAPIOutDTO {
  dateAdded?: Date;
  createdAt: Date;
  overawardOrigin: DisbursementOverawardOriginType;
  awardValueCode: string;
  overawardValue: number;
  applicationNumber?: string;
  assessmentTriggerType?: AssessmentTriggerType;
}

export class AESTOverawardAPIOutDTO extends StudentsOverawardAPIOutDTO {
  addedByUser?: string;
}

export class OverawardManualRecordAPIInDTO {
  @Length(AWARD_VALUE_CODE_LENGTH, AWARD_VALUE_CODE_LENGTH)
  awardValueCode: string;
  @Min(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE * -1)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @NotEquals(0)
  overawardValue: number;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  overawardNotes: string;
}
