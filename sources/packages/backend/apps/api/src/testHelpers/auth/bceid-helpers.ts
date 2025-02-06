import { TestingModule } from "@nestjs/testing";
import { Institution, User } from "@sims/sims-db";
import { getProviderInstanceForModule } from "@sims/test-utils";
import { AppInstitutionsModule } from "../../app.institutions.module";
import { BCeIDService } from "../../services";

/**
 * Mocks BCeID account info from BCeID service to return the passed BCeID account.
 * @param testingModule nest testing module.
 * @param user a persisted user object.
 * @param displayName a persisted display name for user login.
 * @param institution a persisted institution object.
 * @param returnsNull indicates whether mocks a null response.
 * @returns a persisted BCeID account object.
 */
export async function mockBCeIDAccountDetails(
  testingModule: TestingModule,
  user: User,
  institution: Institution,
  returnsNull?: boolean,
): Promise<jest.SpyInstance> {
  const bceIDService = await getProviderInstanceForModule(
    testingModule,
    AppInstitutionsModule,
    BCeIDService,
  );
  return jest
    .spyOn(bceIDService, "getAccountDetails")
    .mockImplementation(() => {
      const response = returnsNull
        ? null
        : {
            user: {
              guid: user.userName,
              displayName: `${user.firstName}_${user.lastName}`,
              firstname: user.firstName,
              surname: user.lastName,
              email: user.email,
            },
            institution: {
              guid: institution.businessGuid,
              legalName: institution.legalOperatingName,
            },
          };
      return Promise.resolve(response);
    });
}
