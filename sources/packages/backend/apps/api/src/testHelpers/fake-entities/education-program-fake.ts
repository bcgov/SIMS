import * as faker from "faker";
import {
  EducationProgram,
  Institution,
  User,
  ProgramStatus,
  ProgramIntensity,
} from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

/**
 * Create fake education program.
 * @param relations dependencies.
 * - `institution` related institution.
 * - `user` related user.
 * @param options dependencies.
 * - `initialValues` initial values.
 * @returns returns fake education program.
 */
export function createFakeEducationProgram(
  relations?: {
    institution?: Institution;
    user?: User;
  },
  options?: {
    initialValue?: Partial<EducationProgram>;
  },
): EducationProgram {
  const program = new EducationProgram();
  program.name = faker.name.jobArea();
  program.description = "description";
  program.credentialType = "credentialType";
  program.cipCode = "cipCode";
  program.nocCode = "nocCode";
  program.sabcCode = options?.initialValue?.sabcCode;
  program.regulatoryBody = "regulatoryBody";
  program.deliveredOnSite = options?.initialValue?.deliveredOnSite ?? false;
  program.deliveredOnline = options?.initialValue?.deliveredOnline ?? false;
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
  program.submittedBy = relations?.user;
  program.fieldOfStudyCode = 1;
  program.isActive = options?.initialValue?.isActive ?? true;
  return program;
}
