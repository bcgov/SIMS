import { EducationProgram } from "@sims/sims-db";

/**
 * Sort field received from the API to sort the programs by name.
 */
export const PROGRAMS_MANAGEMENT_PROGRAM_NAME_SORT_FIELD = "programName";

/**
 * Maps the sort fields received from the API to the
 * {@link EducationProgram} entity properties, prefixed
 * with the "program" alias used in the query.
 */
export const PROGRAMS_MANAGEMENT_SORT_FIELDS: Record<
  string,
  `program.${keyof EducationProgram}`
> = {
  [PROGRAMS_MANAGEMENT_PROGRAM_NAME_SORT_FIELD]: "program.name",
  credentialType: "program.credentialType",
  cipCode: "program.cipCode",
  sabcCode: "program.sabcCode",
};

/**
 * Program year with at least one education program configuration.
 */
export interface ProgramYearWithConfiguration {
  id: number;
  programYear: string;
  /**
   * Indicates if at least one of the program year's
   * education program configurations is active.
   */
  hasActiveConfiguration: boolean;
}
