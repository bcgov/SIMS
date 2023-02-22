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
import { createFakeInstitutionUser } from "@sims/test-utils";
import {
  COLLEGE_C_BUSINESS_GUID,
  COLLEGE_D_BUSINESS_GUID,
  SIMS2_COLLC_USER,
  SIMS2_COLLD_USER,
  SIMS_COLLC_ADMIN_LEGAL_SIGNING_USER,
  SIMS_COLLD_ADMIN_NON_LEGAL_SIGNING_USER,
} from "@sims/test-utils/constants";
import { DataSource, IsNull } from "typeorm";
import { InstitutionTokenTypes } from "./institution-token-helpers";

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
  }
  const institutionRepo = dataSource.getRepository(Institution);
  const userRepo = dataSource.getRepository(User);
  const institution = await institutionRepo.findOneBy({ businessGuid });
  const user = await userRepo.findOneBy({ userName });
  return { institution, user };
}

export async function authorizeUserForLocation(
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

export async function authorizeUserTokenForLocation(
  dataSource: DataSource,
  userTokenType: InstitutionTokenTypes,
  location: InstitutionLocation,
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
    InstitutionUserTypes.user,
  );
}
