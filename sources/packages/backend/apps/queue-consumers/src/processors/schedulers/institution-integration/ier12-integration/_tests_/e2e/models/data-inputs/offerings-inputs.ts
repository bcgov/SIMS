import { OfferingIntensity } from "@sims/sims-db";
import { IER12Offering } from "./data-inputs.models";

export const OFFERING_FULL_TIME: IER12Offering = {
  yearOfStudy: 5,
  studyStartDate: undefined,
  studyEndDate: undefined,
  actualTuitionCosts: 3333,
  programRelatedCosts: 4444,
  mandatoryFees: 5555,
  exceptionalExpenses: 6666,
  offeringIntensity: OfferingIntensity.fullTime,
};
