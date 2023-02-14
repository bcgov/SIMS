import {
  AssessmentTriggerType,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import {
  AWARD_VALUE_CODE_LENGTH,
  MAXIMUM_AWARD_VALUE,
} from "apps/api/src/utilities";
import { Length, Max, Min } from "class-validator";

export class OverawardBalanceAPIOutDTO {
  overawardBalanceValues: Record<string, number>;
}

export class OverawardAPIOutDTO {
  dateAdded: Date;
  overawardOrigin: DisbursementOverawardOriginType;
  awardValueCode: string;
  overawardValue: number;
  addedByUserFirstName?: string;
  addedByUserLastName?: string;
  applicationNumber?: string;
  assessmentTriggerType?: AssessmentTriggerType;
}

export class OverawardManualRecordAPIInDTO {
  @Length(AWARD_VALUE_CODE_LENGTH)
  awardValueCode: string;
  @Min(1)
  @Max(MAXIMUM_AWARD_VALUE)
  overawardValue: number;
}
