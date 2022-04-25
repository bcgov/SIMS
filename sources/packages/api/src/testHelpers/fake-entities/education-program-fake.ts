import * as faker from "faker";
import {
  EducationProgram,
  Institution,
  User,
  ProgramStatus,
} from "../../database/entities";
import { createFakeInstitution } from "./institution-fake";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";

export function createFakeEducationProgram(
  institution?: Institution,
  user?: User,
): EducationProgram {
  const program = new EducationProgram();
  program.name = faker.name.jobArea();
  program.description = "description";
  program.credentialType = "credentialType";
  program.cipCode = "cipCode";
  program.nocCode = "nocCode";
  program.sabcCode = "sabcCode";
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
  program.institution = institution ?? createFakeInstitution();
  program.programIntensity = ProgramIntensity.fullTime;
  program.submittedBy = user;
  return program;
}
