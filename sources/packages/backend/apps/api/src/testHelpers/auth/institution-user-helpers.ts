import { TestingModule } from "@nestjs/testing";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AuthModule } from "../../auth/auth.module";
import { InstitutionUserAuthService } from "../../services";
import { InstitutionUserAuthorizations } from "../../services/institution-user-auth/institution-user-auth.models";

/**
 * Mocks institution user authorizations that will be required to authorize the token.
 * @param testingModule nest testing module.
 * @param institutionUserAuthorizations authorizations.
 */
export async function mockInstitutionUserAuthorization(
  testingModule: TestingModule,
  institutionUserAuthorizations: InstitutionUserAuthorizations,
): Promise<void> {
  const institutionUserAuthService = await getProviderInstanceForModule(
    testingModule,
    AuthModule,
    InstitutionUserAuthService,
  );
  jest
    .spyOn(institutionUserAuthService, "getAuthorizationsByUserName")
    .mockImplementation(() => {
      return Promise.resolve(institutionUserAuthorizations);
    });
}
