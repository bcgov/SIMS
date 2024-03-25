import * as faker from "faker";
import { createFakeLocation } from ".";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  OfferingIntensity,
  OfferingStatus,
} from "@sims/sims-db";
import { createFakeEducationProgram } from "./education-program-fake";

export function createFakeEducationProgramOffering(
  program?: EducationProgram,
  institutionLocation?: InstitutionLocation,
): EducationProgramOffering {
  const offering = new EducationProgramOffering();
  offering.name = faker.random.word();
  offering.actualTuitionCosts = faker.datatype.number(1000);
  offering.programRelatedCosts = faker.datatype.number(1000);
  offering.mandatoryFees = faker.datatype.number(1000);
  offering.exceptionalExpenses = faker.datatype.number(1000);
  offering.offeringDelivered = "offeringDelivered";
  offering.lacksStudyBreaks = true;
  offering.educationProgram = program ?? createFakeEducationProgram();
  offering.institutionLocation = institutionLocation ?? createFakeLocation();
  offering.offeringIntensity = OfferingIntensity.fullTime;
  offering.offeringType = OfferingTypes.Public;
  offering.yearOfStudy = 1;
  offering.courseLoad = 45;
  offering.hasOfferingWILComponent = "no";
  offering.offeringDeclaration = true;
  offering.offeringStatus = OfferingStatus.Approved;
  return offering;
}
