import { OfferingIntensity } from "@/types/contracts/OfferingContact";

/**
 * Program offering summary DTO for Vue.
 */
export interface EducationProgramOfferingDto {
  id: number;
  offeringName: string;
  studyDates: string;
  offeringDelivered: string;
  offeringIntensity: OfferingIntensity;
}
