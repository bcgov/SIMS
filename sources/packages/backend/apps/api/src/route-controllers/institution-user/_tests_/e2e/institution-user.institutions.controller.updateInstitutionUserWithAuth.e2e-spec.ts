import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeInstitutionUser,
  createFakeInstitutionUserAuth,
  createFakeUser,
} from "@sims/test-utils";
import {
  Institution,
  InstitutionLocation,
  InstitutionUserTypeAndRole,
  InstitutionUserTypes,
} from "@sims/sims-db";

describe("InstitutionUserInstitutionsController(e2e)-updateInstitutionUserWithAuth", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocationA: InstitutionLocation;
  let collegeFLocationB: InstitutionLocation;
  let collegeFInstitution: Institution;
  let institutionUserRole: InstitutionUserTypeAndRole;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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
    institutionUserRole = await db.institutionUserTypeAndRole.findOne({
      where: { type: InstitutionUserTypes.user },
    });
  });

  it("Should throw a HttpStatus Not Found (404) error when the user to be updated not found.", async () => {
    // Arrange
    const payload = {
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = "/institutions/institution-user/99999";

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "User to be updated not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a UnprocessableEntityException error when the user to be updated is an inactive user.", async () => {
    // Arrange
    const user = createFakeUser();
    user.isActive = false;
    const institutionUser = createFakeInstitutionUser(
      user,
      collegeFInstitution,
    );
    await db.institutionUser.save(institutionUser);
    const institutionUserAuth = createFakeInstitutionUserAuth(
      institutionUser,
      institutionUserRole,
      collegeFLocationA,
    );
    await db.institutionUserAuth.save(institutionUserAuth);

    const payload = {
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/institution-user/${institutionUser.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Not able to edit an inactive user.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a HttpStatus Forbidden error when the user to be updated does not belong to the institution.", async () => {
    // Arrange
    const institutionUser = createFakeInstitutionUser();
    await db.institutionUser.save(institutionUser);
    const institutionUserAuth = createFakeInstitutionUserAuth(
      institutionUser,
      institutionUserRole,
      collegeFLocationA,
    );
    await db.institutionUserAuth.save(institutionUserAuth);

    const payload = {
      permissions: [{ locationId: collegeFLocationA.id, userType: "user" }],
    };

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/institution-user/${institutionUser.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "User to be updated does not belong to the institution.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should update an institution user with user and read-only auth types when valid data is passed.", async () => {
    // Arrange
    const institutionUser = createFakeInstitutionUser(
      createFakeUser(),
      collegeFInstitution,
    );
    await db.institutionUser.save(institutionUser);
    const institutionUserAuth = createFakeInstitutionUserAuth(
      institutionUser,
      institutionUserRole,
      collegeFLocationA,
    );
    await db.institutionUserAuth.save(institutionUserAuth);
    const user = institutionUser.user;
    const payload = {
      permissions: [
        { locationId: collegeFLocationA.id, userType: "read-only-user" },
        { locationId: collegeFLocationB.id, userType: "user" },
      ],
    };

    // Institution token.
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/institution-user/${institutionUser.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
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
      where: { id: institutionUser.id },
    });
    expect(savedInstitutionUser.user).toEqual(
      expect.objectContaining({
        userName: user.userName,
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
      where: { institutionUser: { id: institutionUser.id } },
    });
    expect(savedInstitutionUserAuths).toHaveLength(2);
    expect(savedInstitutionUserAuths).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          authType: expect.objectContaining({
            type: InstitutionUserTypes.readOnlyUser,
            role: null,
          }),
          location: expect.objectContaining({ id: collegeFLocationA.id }),
        }),
        expect.objectContaining({
          authType: expect.objectContaining({
            type: InstitutionUserTypes.user,
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
