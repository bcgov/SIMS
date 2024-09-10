import { TestingModule } from "@nestjs/testing";
import { InstitutionUserRoles, InstitutionUserTypes } from "@sims/sims-db";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AuthModule } from "../../auth/auth.module";
import { InstitutionUserAuthService } from "../../services";

/**
 * Mocks user log info for institutions.
 * @param testingModule nest testing module.
 * @param institutionUserAuthorizations authorizations.
 */
export async function mockInstitutionUserAuthorization(
  testingModule: TestingModule,
  institutionUserAuthorizations: {
    institutionId: number;
    authorizations: [
      {
        locationId?: number;
        userType: InstitutionUserTypes;
        userRole: InstitutionUserRoles;
      },
    ];
  },
) {
  const institutionUserAuthService = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    InstitutionUserAuthService,
  );
  institutionUserAuthService.getAuthorizationsByUserName = jest
    .fn()
    .mockResolvedValue(institutionUserAuthorizations);
}
