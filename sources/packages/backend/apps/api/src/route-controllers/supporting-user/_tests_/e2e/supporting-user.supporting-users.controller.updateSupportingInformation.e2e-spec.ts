import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTToken,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import { AuthorizedParties } from "../../../../auth/authorized-parties.enum";
import { MISSING_USER_INFO } from "../../../../constants";
import {
  IdentityProviders,
  OfferingIntensity,
  SupportingUserType,
} from "@sims/sims-db";
import { UpdateSupportingUserAPIInDTO } from "../../models/supporting-user.dto";

describe("SupportingUserSupportingUsersController(e2e)-updateSupportingInformation", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  const endpoint = "/supporting-users/supporting-user";

  beforeAll(async () => {
    const { nestApplication, module } = await createTestingAppModule();
    app = nestApplication;
    appModule = module;
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it(
    "Should return a bad request error when the supporting user authentication token is missing " +
      "the mandatory e-mail, last name, or birthdate information.",
    async () => {
      // Arrange
      // The payload does not need to represent a real Student Application because the
      // missing user information validation happens before any application lookup.
      const payload: UpdateSupportingUserAPIInDTO = {
        applicationNumber: "1234567890",
        addressLine1: "123 Some Street",
        addressLine2: undefined,
        city: "Victoria",
        country: "Canada",
        phone: "1234567890",
        postalCode: "V1V1V1",
        provinceState: "BC",
        studentsLastName: "Doe",
        supportingUserType: SupportingUserType.Parent,
        fullName: "Jane Doe",
        supportingData: { someKey: "someValue" },
        offeringIntensity: OfferingIntensity.fullTime,
      };
      // Mocked BCSC supporting user token without a verified email address.
      await mockJWTToken(appModule, (jwtPayload) => {
        jwtPayload.azp = AuthorizedParties.supportingUsers;
        jwtPayload.identityProvider = IdentityProviders.BCSC;
        jwtPayload.lastName = "Doe";
        jwtPayload.birthdate = "2000-01-01";
        jwtPayload.email = undefined;
      });
      const supportingUserToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(supportingUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message:
            "Some mandatory profile information (e-mail, last name, or date of birth) was not " +
            "provided by the identity provider. Please ensure your BC Services Card identity " +
            "information, including a verified e-mail address, is complete and try again.",
          errorType: MISSING_USER_INFO,
        });
    },
  );
  afterAll(async () => {
    await app?.close();
  });
});
