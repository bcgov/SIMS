import {
  Institution,
  InstitutionLocation,
  InstitutionUser,
  InstitutionUserAuth,
  InstitutionUserRoles,
  InstitutionUserTypeAndRole,
  InstitutionUserTypes,
  User,
} from "@sims/sims-db";
import {
  createFakeInstitutionLocation,
  createFakeInstitutionUser,
  E2EDataSources,
} from "@sims/test-utils";
import {
  COLLEGE_C_BUSINESS_GUID,
  COLLEGE_D_BUSINESS_GUID,
  COLLEGE_E_BUSINESS_GUID,
  COLLEGE_F_BUSINESS_GUID,
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS2_COLLE_USER,
  SIMS2_COLLF_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER,
  SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER,
} from "@sims/test-utils/constants";
import { DataSource, IsNull } from "typeorm";
import { InstitutionTokenTypes } from "./institution-token-helpers";

/**
 * Get the institution and user associated with the institution user token type.
 * This data is currently created on DB by the test-db-seeding prior to E2E tests execution.
 * @param dataSource allow access to the database.
 * @param userType type of the institution user.
 * @returns institution and user associated with the institution user token type.
 */
export async function getAuthRelatedEntities(
  dataSource: DataSource,
  userType: InstitutionTokenTypes,
): Promise<{ institution: Institution; user: User }> {
  let businessGuid: string;
  let userName: string;
  switch (userType) {
    case InstitutionTokenTypes.CollegeCAdminLegalSigningUser:
      businessGuid = COLLEGE_C_BUSINESS_GUID;
      userName = SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER;
      break;
    case InstitutionTokenTypes.CollegeCUser:
      businessGuid = COLLEGE_C_BUSINESS_GUID;
      userName = SIMS2_COLLC_USER;
      break;
    case InstitutionTokenTypes.CollegeDAdminNonLegalSigningUser:
      businessGuid = COLLEGE_D_BUSINESS_GUID;
      userName = SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER;
      break;
    case InstitutionTokenTypes.CollegeDUser:
      businessGuid = COLLEGE_D_BUSINESS_GUID;
      userName = SIMS2_COLLD_USER;
      break;
    case InstitutionTokenTypes.CollegeEAdminNonLegalSigningUser:
      businessGuid = COLLEGE_E_BUSINESS_GUID;
      userName = SIMS_COLLE_ADMIN_NON_LEGAL_SIGNING_USER;
      break;
    case InstitutionTokenTypes.CollegeEReadOnlyUser:
      businessGuid = COLLEGE_E_BUSINESS_GUID;
      userName = SIMS2_COLLE_USER;
      break;
    case InstitutionTokenTypes.CollegeFAdminLegalSigningUser:
      businessGuid = COLLEGE_F_BUSINESS_GUID;
      userName = SIMS_COLLF_ADMIN_LEGAL_SIGNING_USER;
      break;
    case InstitutionTokenTypes.CollegeFUser:
      businessGuid = COLLEGE_F_BUSINESS_GUID;
      userName = SIMS2_COLLF_USER;
      break;
  }
  const institutionRepo = dataSource.getRepository(Institution);
  const userRepo = dataSource.getRepository(User);
  const institution = await institutionRepo.findOneBy({ businessGuid });
  const user = await userRepo.findOneBy({ userName });
  return { institution, user };
}

/**
 * Authorize a user to have access to a location.
 * @param dataSource manage the database access.
 * @param institutionId related institution.
 * @param userId user to be associated with the institution.
 * @param locationId location to be granted access to.
 * @param type type of authorization.
 * @param role authorization role.
 */
async function authorizeUserForLocation(
  dataSource: DataSource,
  institutionId: number,
  userId: number,
  locationId: number,
  type: InstitutionUserTypes,
  role?: InstitutionUserRoles,
) {
  const userTypeAndRole = await dataSource
    .getRepository(InstitutionUserTypeAndRole)
    .findOne({
      where: {
        type: type,
        role: role ?? IsNull(),
        active: true,
      },
    });
  // Associate user to the institution.
  const institutionUser = createFakeInstitutionUser(
    { id: userId } as User,
    { id: institutionId } as Institution,
  );
  const savedInstitutionUser = await dataSource
    .getRepository(InstitutionUser)
    .save(institutionUser);
  // Associate permission to the user.
  const authorization = new InstitutionUserAuth();
  authorization.authType = userTypeAndRole;
  authorization.institutionUser = savedInstitutionUser;
  authorization.location = { id: locationId } as InstitutionLocation;
  await dataSource.getRepository(InstitutionUserAuth).save(authorization);
}

/**
 * Allow user access to a location. Useful when a new location is created and
 * the institution user to be authenticated will need access to it.
 * @param dataSource manage database access.
 * @param userTokenType user type that need to be associated. This will be the
 * same userTokenType used to authenticate to the API.
 * @param location location to have the access granted for the user.
 * @param options optional parameters.
 */
export async function authorizeUserTokenForLocation(
  dataSource: DataSource,
  userTokenType: InstitutionTokenTypes,
  location: InstitutionLocation,
  options?: {
    institutionUserType?: InstitutionUserTypes;
  },
) {
  const { institution, user } = await getAuthRelatedEntities(
    dataSource,
    userTokenType,
  );
  if (!location.id) {
    location.institution = institution;
    await dataSource.getRepository(InstitutionLocation).save(location);
  }
  await authorizeUserForLocation(
    dataSource,
    institution.id,
    user.id,
    location.id,
    options?.institutionUserType ?? InstitutionUserTypes.user,
  );
}

/**
 * Create a location with read only user access.
 * This is useful for tests that need to assert that the API endpoints
 * are properly restricted for read only users.
 * @param db E2E testing data sources.
 * @param institutionTokenType user type that will have read only access.
 * @returns location the user will have read only access.
 */
export async function getReadOnlyAuthorizedLocation(
  db: E2EDataSources,
  institutionTokenType: InstitutionTokenTypes,
) {
  const { institution } = await getAuthRelatedEntities(
    db.dataSource,
    institutionTokenType,
  );
  const location = createFakeInstitutionLocation({ institution });
  await authorizeUserTokenForLocation(
    db.dataSource,
    institutionTokenType,
    location,
    { institutionUserType: InstitutionUserTypes.readOnlyUser },
  );
  return location;
}

export const INSTITUTION_BC_PUBLIC_ERROR_MESSAGE =
  "The institution is not BC Public.";

export const INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE =
  "The institution is not allowed access to the student data of the given student.";
