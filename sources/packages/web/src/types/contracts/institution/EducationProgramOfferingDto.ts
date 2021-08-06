import { ValidIntensity } from "@/types/contracts/OfferingContact";
export interface EducationProgramOfferingDto {
  id: number;
  name: string;
  studyDates: string;
  offeringDelivered: string;
  validIntensity: ValidIntensity;
}
