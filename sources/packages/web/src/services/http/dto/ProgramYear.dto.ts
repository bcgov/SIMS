import { OfferingIntensity } from "@/types";

export interface ProgramYearApiOutDTO {
  id: number;
  programYear: string;
  description: string;
  startDate: string;
  endDate: string;
  offeringIntensity: OfferingIntensity[];
}

export interface ProgramYearsApiOutDTO {
  programYears: ProgramYearApiOutDTO[];
}
