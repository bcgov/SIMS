import { InstitutionRestriction } from "@sims/sims-db";

/**
 * Get effective institution restrictions for the given location and program.
 * @param institutionRestrictions institution restrictions.
 * @param locationId location id.
 * @param programId program id.
 * @param options options.
 * - `checkIsActive` check if the restriction is active.
 * @returns effective institution restrictions.
 */
export function getEffectiveInstitutionRestrictions(
  institutionRestrictions: InstitutionRestriction[],
  locationId: number,
  programId: number,
  options?: {
    checkIsActive?: true;
  },
): InstitutionRestriction[] {
  return institutionRestrictions.filter(
    (institutionRestriction) =>
      institutionRestriction.location.id === locationId &&
      institutionRestriction.program.id === programId &&
      (!options?.checkIsActive || institutionRestriction.isActive),
  );
}
