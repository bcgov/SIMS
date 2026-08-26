import { DataSource } from "typeorm";

/**
 * Removes the cached authorizations for an institution user. Must be
 * called whenever the user's roles/locations assignments change.
 * @param dataSource manage database access.
 * @param userName user name (same as Keycloak) used for the login.
 */
export async function clearUserAuthorizationsCache(
  dataSource: DataSource,
  userName: string,
): Promise<void> {
  await dataSource.queryResultCache?.remove([
    `user-authorizations_${userName}`,
  ]);
}

/**
 * Removes the cached institution locations Ids. Must be called whenever
 * a location is added to the institution.
 * @param dataSource manage database access.
 * @param institutionId institution id.
 */
export async function clearInstitutionLocationsCache(
  dataSource: DataSource,
  institutionId: number,
): Promise<void> {
  await dataSource.queryResultCache?.remove([
    `institution-locations_${institutionId}`,
  ]);
}
