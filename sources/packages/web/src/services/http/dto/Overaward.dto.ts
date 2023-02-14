import {
  AssessmentTriggerType,
  DisbursementOverawardOriginType,
} from "@/types";

export interface OverawardBalanceAPIOutDTO {
  overawardBalanceValues: Record<string, number>;
}

export interface OverawardAPIOutDTO {
  dateAdded: Date;
  overawardOrigin: DisbursementOverawardOriginType;
  awardValueCode: string;
  overawardValue: number;
  addedByUserFirstName?: string;
  addedByUserLastName?: string;
  applicationNumber?: string;
  assessmentTriggerType?: AssessmentTriggerType;
}
