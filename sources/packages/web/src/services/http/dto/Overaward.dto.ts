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
  addedByUser?: string;
  applicationNumber?: string;
  assessmentTriggerType?: AssessmentTriggerType;
}

export interface OverawardManualRecordAPIInDTO {
  awardValueCode: string;
  overawardValue: number;
  overawardNotes: string;
}
