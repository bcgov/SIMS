import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import * as faker from "faker";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
  mockBCeIDAccountDetails,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";
import {
  IdentityProviders,
  Institution,
  InstitutionLocation,
  InstitutionUserTypes,
} from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";
import {
  BCEID_ACCOUNT_NOT_FOUND,
  INSTITUTION_USER_ALREADY_EXISTS,
} from "../../../../constants";

describe("InstitutionUserInstitutionsController(e2e)-createInstitutionUserWithAuth", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let collegeFLocationA: InstitutionLocation;
  let collegeFLocationB: InstitutionLocation;
  let collegeFInstitution: Institution;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    // Location A.
    collegeFLocationA = createFakeInstitutionLocation({
      institution: collegeF,
    });
    // Location B.
    collegeFLocationB = createFakeInstitutionLocation({
      institution: collegeF,
    });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocationA,
    );
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocationB,
    );
    collegeFInstitution = collegeFLocationA.institution;
  });

  it("Should throw an UnprocessableEntityException error when the user passed in the payload is not found on BCeID.", async () => {
    // Arrange
    const user = createFakeUser();
    const payload = {
      bceidUserId: faker.random.alpha({ count: 5 }),
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };

    // Mock BCeID account method to return null response.
    await mockBCeIDAccountDetails(appModule, user, collegeFInstitution, true);

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = "/institutions/institution-user";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "User not found on BCeID.",
        errorType: BCEID_ACCOUNT_NOT_FOUND,
      });
  });

  it("Should throw an UnprocessableEntityException error when the user to be added is not found under the institution.", async () => {
    // Arrange
    const user = createFakeUser();
    const payload = {
      bceidUserId: faker.random.alpha({ count: 5 }),
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };
    const { institution: collegeD } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeDUser,
    );
    const collegeDLocation = createFakeInstitutionLocation({
      institution: collegeD,
    });

    // Mock BCeID account details.
    await mockBCeIDAccountDetails(
      appModule,
      user,
      collegeDLocation.institution,
    );
    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = "/institutions/institution-user";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "User to be added not found under the institution.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an UnprocessableEntityException error when the user to be added already exists.", async () => {
    // Arrange
    const user = createFakeUser();
    // Copy the initial userName before adding @bceidboth.
    const userGuid = user.userName;
    user.userName =
      `${user.userName}@${IdentityProviders.BCeIDBoth}`.toLowerCase();
    await db.user.save(user);

    const payload = {
      bceidUserId: faker.random.alpha({ count: 5 }),
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };

    // Mock get BCeID account details with the initial userName.
    await mockBCeIDAccountDetails(
      appModule,
      { ...user, userName: userGuid },
      collegeFInstitution,
    );

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = "/institutions/institution-user";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The user already exists.",
        errorType: INSTITUTION_USER_ALREADY_EXISTS,
      });
  });

  it("Should create an institution user with user and read-only auth types when valid data is passed.", async () => {
    // Arrange
    const user = createFakeUser();
    const payload = {
      bceidUserId: faker.random.alpha({ count: 5 }),
      permissions: [
        { locationId: collegeFLocationA.id, userType: "user" },
        { locationId: collegeFLocationB.id, userType: "read-only-user" },
      ],
    };

    // Mock get BCeID account details
    await mockBCeIDAccountDetails(appModule, user, collegeFInstitution);
    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = "/institutions/institution-user";

    // Act/Assert
    let institutionUserId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        institutionUserId = response.body.id;
      });
    const savedInstitutionUser = await db.institutionUser.findOne({
      select: {
        user: {
          userName: true,
          email: true,
          firstName: true,
          lastName: true,
        },
        institution: {
          id: true,
          businessGuid: true,
          legalOperatingName: true,
        },
      },
      where: { id: institutionUserId },
    });
    expect(savedInstitutionUser.user).toEqual(
      expect.objectContaining({
        userName:
          `${user.userName}@${IdentityProviders.BCeIDBoth}`.toLowerCase(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }),
    );
    expect(savedInstitutionUser.institution).toEqual(
      expect.objectContaining({
        id: collegeFInstitution.id,
        businessGuid: collegeFInstitution.businessGuid,
        legalOperatingName: collegeFInstitution.legalOperatingName,
      }),
    );
    const savedInstitutionUserAuths = await db.institutionUserAuth.find({
      select: {
        location: {
          id: true,
        },
        authType: { type: true },
      },
      relations: { institutionUser: true, location: true },
      where: { institutionUser: { id: institutionUserId } },
    });
    expect(savedInstitutionUserAuths).toHaveLength(2);
    expect(savedInstitutionUserAuths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          authType: expect.objectContaining({
            type: InstitutionUserTypes.user,
            role: null,
          }),
          location: expect.objectContaining({ id: collegeFLocationA.id }),
        }),
        expect.objectContaining({
          authType: expect.objectContaining({
            type: InstitutionUserTypes.readOnlyUser,
            role: null,
          }),
          location: expect.objectContaining({ id: collegeFLocationB.id }),
        }),
      ]),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
