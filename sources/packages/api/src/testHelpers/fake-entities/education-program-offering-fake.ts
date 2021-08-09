import * as faker from "faker";
import { createFakeLocation } from ".";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
} from "../../database/entities";
import { createFakeEducationProgram } from "./education-program-fake";
import { OfferingIntensity } from "../../database/entities/offering-intensity.type";

export function createFakeEducationProgramOffering(
  program?: EducationProgram,
  institutionLocation?: InstitutionLocation,
): EducationProgramOffering {
  const offering = new EducationProgramOffering();
  offering.name = faker.random.word();
  offering.actualTuitionCosts = faker.random.number(1000);
  offering.programRelatedCosts = faker.random.number(1000);
  offering.mandatoryFees = faker.random.number(1000);
  offering.exceptionalExpenses = faker.random.number(1000);
  offering.tuitionRemittanceRequestedAmount = faker.random.number(1000);
  offering.offeringDelivered = "offeringDelivered";
  offering.lacksStudyDates = true;
  offering.lacksStudyBreaks = true;
  offering.lacksFixedCosts = true;
  offering.tuitionRemittanceRequested = "tuitionRemittanceRequested";
  offering.educationProgram = program ?? createFakeEducationProgram();
  offering.institutionLocation = institutionLocation ?? createFakeLocation();
  offering.offeringIntensity = OfferingIntensity.fullTime;
  return offering;
}
