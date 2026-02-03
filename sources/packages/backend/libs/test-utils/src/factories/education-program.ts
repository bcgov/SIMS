import { faker } from "@faker-js/faker";
import {
  EducationProgram,
  Institution,
  User,
  ProgramStatus,
  ProgramIntensity,
} from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

export function createFakeEducationProgram(
  relations: {
    auditUser: User;
    institution?: Institution;
  },
  options?: { initialValues?: Partial<EducationProgram> },
): EducationProgram {
  const program = new EducationProgram();
  program.name = options?.initialValues?.name ?? faker.person.jobArea();
  program.description = "description";
  program.credentialType = "credentialType";
  program.cipCode = "cipCode";
  program.nocCode = "nocCode";
  program.fieldOfStudyCode = 99;
  program.regulatoryBody = "regulatoryBody";
  program.deliveredOnSite = options?.initialValues?.deliveredOnSite ?? false;
  program.deliveredOnline = false;
  program.courseLoadCalculation = "courseLoadCalculation";
  program.completionYears = "completionYears";
  program.eslEligibility = "eslEligibility";
  program.hasJointInstitution = "hasJointInstitution";
  program.hasJointDesignatedInstitution = "hasJointDesignatedInstitution";
  program.programStatus =
    options?.initialValues?.programStatus ?? ProgramStatus.Approved;
  program.hasWILComponent = "yes";
  program.hasTravel = "yes";
  program.hasIntlExchange = "yes";
  program.programDeclaration = true;
  program.institution = relations?.institution ?? createFakeInstitution();
  program.programIntensity =
    options?.initialValues?.programIntensity ?? ProgramIntensity.fullTime;
  program.isAviationProgram = options?.initialValues?.isAviationProgram ?? "no";
  program.submittedBy = relations.auditUser;
  if (options?.initialValues?.submittedDate) {
    program.submittedDate = options.initialValues.submittedDate;
  }
  program.isActive = options?.initialValues?.isActive ?? true;
  program.effectiveEndDate = options?.initialValues?.effectiveEndDate ?? null;
  program.sabcCode = options?.initialValues?.sabcCode ?? null;
  return program;
}
