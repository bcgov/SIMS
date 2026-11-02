import { faker } from "@faker-js/faker";
import {
  EducationProgram,
  Institution,
  User,
  ProgramStatus,
  ProgramIntensity,
  EducationProgramConfiguration,
} from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

export function createFakeEducationProgram(
  relations: {
    auditUser: User;
    programConfiguration: EducationProgramConfiguration;
    institution?: Institution;
  },
  options?: { initialValues?: Partial<EducationProgram> },
): EducationProgram {
  const program = new EducationProgram();
  program.name = options?.initialValues?.name ?? faker.person.jobArea();
  program.description = "description";
  program.credentialType = "credentialType";
  program.cipCode = options?.initialValues?.cipCode ?? "cipCode";
  program.nocCode = "nocCode";
  program.fieldOfStudyCode = 99;
  program.regulatoryBody = "regulatoryBody";
  program.deliveredOnSite = options?.initialValues?.deliveredOnSite ?? false;
  program.deliveredOnline = options?.initialValues?.deliveredOnline ?? false;
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
  program.programData =
    options?.initialValues?.programData ?? createFakeProgramData(program);
  program.programConfiguration = relations.programConfiguration;
  return program;
}

/**
 * Creates the program data based on the program columns values,
 * following the same mapping used by the migration that backfilled
 * the program_data column.
 * @param program program to have its column values mapped.
 * @returns program data.
 */
function createFakeProgramData(
  program: EducationProgram,
): Record<string, unknown> {
  const programDeliveryTypes: string[] = [];
  if (program.deliveredOnSite) {
    programDeliveryTypes.push("deliveredOnSite");
  }
  if (program.deliveredOnline) {
    programDeliveryTypes.push("deliveredOnline");
  }
  const programData: Record<string, unknown> = {
    programName: program.name,
    programDescription: program.description,
    credentialType: program.credentialType,
    cipCode: program.cipCode,
    nocCode: program.nocCode,
    regulatoryBody: program.regulatoryBody,
    programDeliveryTypes,
    courseLoadCalculation: program.courseLoadCalculation,
    completionYears: program.completionYears,
    eslEligibility: program.eslEligibility,
    hasJointInstitution: program.hasJointInstitution,
    hasJointDesignatedInstitution: program.hasJointDesignatedInstitution,
    programIntensity: program.programIntensity,
    isAviationProgram: program.isAviationProgram,
    hasWILComponent: program.hasWILComponent,
    hasTravel: program.hasTravel,
    hasIntlExchange: program.hasIntlExchange,
    programDeclaration: program.programDeclaration,
    fieldOfStudyCode: program.fieldOfStudyCode,
  };
  if (program.sabcCode) {
    programData.sabcCode = program.sabcCode;
  }
  return programData;
}
