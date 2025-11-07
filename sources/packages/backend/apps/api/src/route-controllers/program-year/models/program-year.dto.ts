import { OfferingIntensity } from "@sims/sims-db";

export class ProgramYearApiOutDTO {
  id: number;
  programYear: string;
  description: string;
  offeringIntensity: OfferingIntensity[];
}

export class ProgramYearsApiOutDTO {
  programYears: ProgramYearApiOutDTO[];
}
