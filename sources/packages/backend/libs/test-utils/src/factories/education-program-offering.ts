import * as faker from "faker";
import { createFakeInstitutionLocation } from "./institution-location";
import { createFakeEducationProgram } from "./education-program";
import {
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  OfferingIntensity,
  User,
  OfferingStatus,
  Institution,
  StudyBreaksAndWeeks,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";

export function createFakeEducationProgramOffering(relations?: {
  auditUser: User;
  program?: EducationProgram;
  institution?: Institution;
  institutionLocation?: InstitutionLocation;
}): EducationProgramOffering {
  // Case an institution location is provided already associated with
  // an institution ensure that the relationship will be kept and
  // another institution will not be generated.
  const institution =
    relations?.institutionLocation?.institution ?? relations.institution;
  const offering = new EducationProgramOffering();
  offering.name = faker.random.word();
  offering.actualTuitionCosts = faker.random.number(1000);
  offering.programRelatedCosts = faker.random.number(1000);
  offering.mandatoryFees = faker.random.number(1000);
  offering.exceptionalExpenses = faker.random.number(1000);
  offering.offeringDelivered = "offeringDelivered";
  offering.lacksStudyBreaks = true;
  offering.educationProgram =
    relations?.program ??
    createFakeEducationProgram({
      institution,
      auditUser: relations.auditUser,
    });
  offering.institutionLocation =
    relations?.institutionLocation ?? createFakeInstitutionLocation();
  offering.offeringIntensity = OfferingIntensity.fullTime;
  offering.offeringType = OfferingTypes.Public;
  offering.yearOfStudy = 1;
  offering.courseLoad = 45;
  offering.hasOfferingWILComponent = "no";
  offering.offeringDeclaration = true;
  offering.studyStartDate = getISODateOnlyString(faker.date.recent(1));
  offering.studyEndDate = getISODateOnlyString(faker.date.soon(30));
  offering.studyBreaks = {
    totalFundedWeeks: 16,
  } as StudyBreaksAndWeeks;
  offering.offeringStatus = OfferingStatus.Approved;
  return offering;
}
