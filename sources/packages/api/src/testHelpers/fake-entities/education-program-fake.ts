import * as faker from "faker";
import { EducationProgram, Institution } from "../../database/entities";
import { createFakeInstitution } from "./institution-fake";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";

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
  program.averageHoursStudy = 1;
  program.completionYears = "completionYears";
  program.admissionRequirement = "admissionRequirement";
  program.eslEligibility = "eslEligibility";
  program.hasJointInstitution = "hasJointInstitution";
  program.hasJointDesignatedInstitution = "hasJointDesignatedInstitution";
  program.approvalStatus = "approvalStatus";
  program.institution = institution ?? createFakeInstitution();
  program.programIntensity = ProgramIntensity.fullTime;
  return program;
}
