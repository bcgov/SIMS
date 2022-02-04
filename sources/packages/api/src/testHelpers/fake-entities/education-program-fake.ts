import * as faker from "faker";
import { EducationProgram, Institution } from "../../database/entities";
import { createFakeInstitution } from "./institution-fake";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";
import { ApprovalStatus } from "../../services/education-program/constants";

export function createFakeEducationProgram(
  institution?: Institution,
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
  program.approvalStatus = ApprovalStatus.approved;
  program.hasWILComponent = "yes";
  program.hasTravel = "yes";
  program.hasIntlExchange = "yes";
  program.programDeclaration = true;
  program.institution = institution ?? createFakeInstitution();
  program.programIntensity = ProgramIntensity.fullTime;
  return program;
}
