import { OfferingIntensity } from "@/types";

export interface AssessmentDetailHeader {
  applicationNumber: string;
  institutionName: string;
  offeringIntensity: OfferingIntensity;
  offeringStudyStartDate: string;
  offeringStudyEndDate: string;
}
