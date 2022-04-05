import { OfferingIntensity } from "@/types/contracts/OfferingContact";

/**
 * Program offering summary DTO for Vue.
 */
export interface EducationProgramOfferingDto {
  id: number;
  name: string;
  studyStartDate: string;
  studyEndDate: string;
  studyDates: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
}
