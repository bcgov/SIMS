import { TestingModule } from "@nestjs/testing";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AuthModule } from "../../auth/auth.module";
import { InstitutionUserAuthService } from "../../services";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";

/**
 * Mocks user log info for institutions.
 * @param testingModule nest testing module.
 * @param institutionUserAuthorizations authorizations.
 */
export async function mockInstitutionUserAuthorization(
  testingModule: TestingModule,
  institutionUserAuthorizations: InstitutionUserAuthorizations,
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
