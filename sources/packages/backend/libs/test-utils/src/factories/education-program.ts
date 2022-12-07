import * as faker from "faker";
import {
  EducationProgram,
  Institution,
  User,
  ProgramStatus,
  ProgramIntensity,
} from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

export function createFakeEducationProgram(relations?: {
  auditUser: User;
  institution?: Institution;
}): EducationProgram {
  const program = new EducationProgram();
  program.name = faker.name.jobArea();
  program.description = "description";
  program.credentialType = "credentialType";
  program.cipCode = "cipCode";
  program.nocCode = "nocCode";
  program.sabcCode = "sabcCode";
  program.fieldOfStudyCode = 99;
  program.regulatoryBody = "regulatoryBody";
  program.deliveredOnSite = false;
  program.deliveredOnline = false;
  program.courseLoadCalculation = "courseLoadCalculation";
  program.completionYears = "completionYears";
  program.eslEligibility = "eslEligibility";
  program.hasJointInstitution = "hasJointInstitution";
  program.hasJointDesignatedInstitution = "hasJointDesignatedInstitution";
  program.programStatus = ProgramStatus.Approved;
  program.hasWILComponent = "yes";
  program.hasTravel = "yes";
  program.hasIntlExchange = "yes";
  program.programDeclaration = true;
  program.institution = relations?.institution ?? createFakeInstitution();
  program.programIntensity = ProgramIntensity.fullTime;
  program.submittedBy = relations?.auditUser;
  return program;
}
