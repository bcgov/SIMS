import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionUser,
  createFakeInstitutionUserAuth,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import {
  Institution,
  InstitutionUserTypeAndRole,
  InstitutionUserTypes,
} from "@sims/sims-db";
import { UserService } from "../../../../../src/services";

describe("InstitutionUserInstitutionsController(e2e)-updateUserStatus", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let userService: UserService;
  let collegeFInstitution: Institution;
  let institutionUserRole: InstitutionUserTypeAndRole;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    userService = (module as TestingModule).get(UserService);
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFInstitution = collegeF;
    institutionUserRole = await db.institutionUserTypeAndRole.findOne({
      where: { type: InstitutionUserTypes.user },
    });
  });

  it("Should disable an institution user and immediately reflect the change on the cached login information when the user is disabled.", async () => {
    // Arrange
    const institutionUser = createFakeInstitutionUser(
      createFakeUser(),
      collegeFInstitution,
    );
    await db.institutionUser.save(institutionUser);
    const institutionUserAuth = createFakeInstitutionUserAuth(
      institutionUser,
      institutionUserRole,
    );
    await db.institutionUserAuth.save(institutionUserAuth);
    const { userName } = institutionUser.user;
    // Warms up the login information cache with the user still active.
    const activeLoginInfo = await userService.getUserLoginInfo(userName);
    expect(activeLoginInfo.isActive).toBe(true);

    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);
    const endpoint = `/institutions/institution-user/${institutionUser.id}/status`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ isActive: false })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // The cached login information must reflect the change right away instead
    // of continuing to report the user as active until the cache expires.
    const disabledLoginInfo = await userService.getUserLoginInfo(userName);
    expect(disabledLoginInfo).toEqual({
      isActive: false,
      id: activeLoginInfo.id,
      studentId: activeLoginInfo.studentId,
      identityProviderType: activeLoginInfo.identityProviderType,
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
