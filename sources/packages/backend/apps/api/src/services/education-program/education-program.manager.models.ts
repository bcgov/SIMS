import { EducationProgram } from "@sims/sims-db";

/**
 * Maps the sort fields received from the API to the
 * {@link EducationProgram} entity properties.
 */
export const PROGRAMS_MANAGEMENT_SORT_FIELDS: Record<
  string,
  keyof EducationProgram
> = {
  programName: "name",
  credentialType: "credentialType",
  cipCode: "cipCode",
  sabcCode: "sabcCode",
};

/**
 * Sort field received from the API to sort the programs by their status,
 * considering inactive or expired programs as inactive.
 * Inactive programs can include those that are expired or otherwise not currently active,
 * which demands special handling when sorting by program status.
 */
export const PROGRAMS_MANAGEMENT_PROGRAM_STATUS_SORT_FIELD = "programStatus";

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
