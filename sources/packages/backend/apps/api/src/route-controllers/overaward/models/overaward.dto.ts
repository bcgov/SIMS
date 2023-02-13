import {
  AssessmentTriggerType,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";

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
