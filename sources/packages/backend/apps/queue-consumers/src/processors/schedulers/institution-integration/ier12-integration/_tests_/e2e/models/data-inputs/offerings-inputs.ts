import { OfferingIntensity } from "@sims/sims-db";
import { IER12Offering } from "./data-inputs.models";

export const OFFERING_2023_2024_SET_DEC_FULL_TIME: IER12Offering = {
  yearOfStudy: 5,
  studyStartDate: "2023-09-01",
  studyEndDate: "2023-12-31",
  actualTuitionCosts: 3333,
  programRelatedCosts: 4444,
  mandatoryFees: 5555,
  exceptionalExpenses: 6666,
  offeringIntensity: OfferingIntensity.fullTime,
};
