import { faker } from "@faker-js/faker";
import { createFakeLocation } from ".";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  OfferingIntensity,
  OfferingStatus,
  User,
} from "@sims/sims-db";
import { createFakeEducationProgram } from "./education-program-fake";
import { OfferingYesNoOptions } from "../../services/education-program-offering/education-program-offering-validation.models";

export function createFakeEducationProgramOffering(
  auditUser: User,
  program?: EducationProgram,
  institutionLocation?: InstitutionLocation,
): EducationProgramOffering {
  const offering = new EducationProgramOffering();
  offering.name = faker.lorem.word();
  offering.actualTuitionCosts = faker.number.int(1000);
  offering.programRelatedCosts = faker.number.int(1000);
  offering.mandatoryFees = faker.number.int(1000);
  offering.exceptionalExpenses = faker.number.int(1000);
  offering.offeringDelivered = "offeringDelivered";
  offering.lacksStudyBreaks = true;
  offering.educationProgram = program ?? createFakeEducationProgram();
  offering.institutionLocation = institutionLocation ?? createFakeLocation();
  offering.offeringIntensity = OfferingIntensity.fullTime;
  offering.offeringType = OfferingTypes.Public;
  offering.yearOfStudy = 1;
  offering.courseLoad = 45;
  offering.isAviationOffering = OfferingYesNoOptions.No;
  offering.hasOfferingWILComponent = "no";
  offering.offeringDeclaration = true;
  offering.offeringStatus = OfferingStatus.Approved;
  offering.creator = auditUser;
  offering.submittedBy = auditUser;
  return offering;
}
