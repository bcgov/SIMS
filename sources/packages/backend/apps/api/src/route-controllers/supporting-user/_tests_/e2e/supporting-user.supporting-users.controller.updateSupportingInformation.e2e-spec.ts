import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";
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
import {
  ApplicationStatus,
  DynamicFormType,
  FormYesNoOptions,
  IdentityProviders,
  OfferingIntensity,
  SupportingUserType,
} from "@sims/sims-db";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { UpdateSupportingUserAPIInDTO } from "../../models/supporting-user.dto";

describe("SupportingUserSupportingUsersController(e2e)-updateSupportingInformation", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let zeebeClient: ZeebeGrpcClient;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    zeebeClient = app.get(ZeebeGrpcClient);
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
        .patch(getEndpoint())
        .send(payload)
        .auth(supportingUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message:
            "The authenticated user token is missing required profile information.",
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    },
  );

  it("Should save supporting information when a parent submits valid data with all required authentication information.", async () => {
    // Arrange
    const parentForm = await db.dynamicFormConfiguration.findOneOrFail({
      relations: { programYear: true },
      where: {
        formType: DynamicFormType.SupportingUsersParent,
        programYear: { active: true },
      },
      order: { programYear: { startDate: "DESC" } },
    });
    const application = await saveFakeApplication(
      db.dataSource,
      { programYear: parentForm.programYear },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.InProgress,
          offeringIntensity: OfferingIntensity.fullTime,
        },
      },
    );
    const parent = await db.supportingUser.save(
      createFakeSupportingUser(
        { application },
        {
          initialValues: {
            fullName: "Jane Doe",
            isAbleToReport: true,
            supportingUserType: SupportingUserType.Parent,
          },
        },
      ),
    );
    // Use a distinct identity from the student who submitted the application.
    const user = createFakeUser();
    const birthDate = "1980-01-01";
    await mockJWTToken(appModule, (jwtPayload) => {
      jwtPayload.azp = AuthorizedParties.supportingUsers;
      jwtPayload.identityProvider = IdentityProviders.BCSC;
      jwtPayload.userName = user.userName;
      jwtPayload.givenNames = user.firstName;
      jwtPayload.lastName = user.lastName;
      jwtPayload.email = user.email;
      jwtPayload.birthdate = birthDate;
    });
    const supportingUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const payload: UpdateSupportingUserAPIInDTO = {
      applicationNumber: application.applicationNumber,
      studentsLastName: application.student.user.lastName,
      supportingUserType: SupportingUserType.Parent,
      fullName: parent.fullName,
      offeringIntensity: OfferingIntensity.fullTime,
      addressLine1: "123 Some Street",
      addressLine2: undefined,
      city: "Victoria",
      country: "Canada",
      phone: "2505551234",
      postalCode: "V8V1V1",
      provinceState: "BC",
      sin: "544 962 244",
      hasValidSIN: FormYesNoOptions.Yes,
      supportingData: {
        relationshipToStudent: "parent",
        totalIncome: 1000,
        cppLine30800: 0,
        cppLine31000: 0,
        totalIncomeTaxLine43500: 0,
        eiLine31200: 0,
        parentalContributions: 0,
        foreignAssets: 0,
        parentsOtherDependants: "no",
        iAgreeToAboveStudentAidBCConsent: true,
        iAgreeToTheAboveCRAConsent: true,
      },
    };

    // Act
    await request(app.getHttpServer())
      .patch(getEndpoint())
      .send(payload)
      .auth(supportingUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});

    // Assert
    const updatedParent = await db.supportingUser.findOneOrFail({
      where: { id: parent.id },
      relations: { user: true, modifier: true },
    });
    expect(updatedParent).toMatchObject({
      birthDate,
      sin: "544962244",
      personalInfo: { hasValidSIN: FormYesNoOptions.Yes },
      supportingData: payload.supportingData,
      contactInfo: {
        phone: payload.phone,
        address: {
          addressLine1: payload.addressLine1,
          city: payload.city,
          country: payload.country,
          postalCode: payload.postalCode,
          provinceState: payload.provinceState,
        },
      },
      user: {
        userName: user.userName,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      modifier: { id: updatedParent.user.id },
    });
    expect(zeebeClient.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationKey: parent.id.toString(),
        name: "supporting-user-info-received",
        variables: {},
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint for a supporting user to submit their information.
 * @returns Supporting user update endpoint.
 */
function getEndpoint(): string {
  return "/supporting-users/supporting-user";
}
