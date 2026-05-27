import {
  AssessmentTriggerType,
  DisbursementOverawardOriginType,
  NOTE_DESCRIPTION_MAX_LENGTH,
} from "@sims/sims-db";
import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "../../../utilities";
import {
  Max,
  Min,
  NotEquals,
  IsNotEmpty,
  MaxLength,
  IsIn,
} from "class-validator";
import { OVERAWARD_BALANCE_AWARDS } from "@sims/services/constants";

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
  @IsIn(OVERAWARD_BALANCE_AWARDS)
  awardValueCode: string;
  @Min(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE * -1)
  @Max(MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE)
  @NotEquals(0)
  overawardValue: number;
  @IsNotEmpty()
  @MaxLength(NOTE_DESCRIPTION_MAX_LENGTH)
  overawardNotes: string;
}
