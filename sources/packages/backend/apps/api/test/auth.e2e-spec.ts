import { TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "@sims/auth/config";
import { KeycloakService } from "@sims/auth/services";
import {
  PEM_BEGIN_HEADER,
  PEM_END_HEADER,
} from "@sims/auth/utilities/certificate-utils";
import {
  createE2EDataSources,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../src/testHelpers";
import { JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@sims/utilities/config";

describe("Authentication (e2e)", () => {
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for student e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from KeyCloak.
  let studentAccessToken: string;
  // Token to be used for AEST e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from KeyCloak.
  let aestAccessToken: string;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let configService: ConfigService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);

    await KeycloakConfig.load();
    const studentToken = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      "student",
    );

    const aestToken = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      "aest",
    );
    studentAccessToken = studentToken.access_token;
    aestAccessToken = aestToken.access_token;

    // const moduleFixture: TestingModule = await Test.createTestingModule({
    //   imports: [AppModule, createZeebeModuleMock()],
    //   // AuthTestController is used only for e2e tests and could be
    //   // changed as needed to implement more test scenarios.
    //   controllers: [AuthTestController],
    // }).compile();
    // app = moduleFixture.createNestApplication();
    await app.init();

    configService = await getProviderInstanceForModule(
      appModule,
      ConfigModule,
      ConfigService,
    );
  });

  it("Load publicKey from Keycloak", async () => {
    // Arrange
    const headerAndFooterLength =
      PEM_BEGIN_HEADER.length + PEM_END_HEADER.length;

    // Act
    await KeycloakConfig.load();

    // Assert
    expect(KeycloakConfig.PEM_PublicKey).toContain(PEM_BEGIN_HEADER);
    expect(KeycloakConfig.PEM_PublicKey).toContain(PEM_END_HEADER);
    // Besides that header and footer, the public_key need have some additional
    // content that would be the public key retrieve fromKeycloak,
    // that does not contains the PEM_BEGIN_HEADER and PEM_END_HEADER.
    expect(KeycloakConfig.PEM_PublicKey.length).toBeGreaterThan(
      headerAndFooterLength,
    );
  });

  it(
    "Should allow BCSC user to access the application when user is not registered in beta users authorizations table " +
      "and config allows any user to access the application.",
    async () => {
      // Arrange
      Object.defineProperty(configService, "allowBetaUsersOnly", {
        value: false,
        writable: true,
      });
      const student = await saveFakeStudent(db.dataSource);

      // Mock user services for a BCSC user.
      await mockUserLoginInfo(appModule, student);

      const endpoint = "/students/student";
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    },
  );

  it(
    "Should not allow BCSC beta user to access the application when user is not registered in beta users authorizations table " +
      "and config allows only beta users to access the application.",
    async () => {
      // Arrange
      Object.defineProperty(configService, "allowBetaUsersOnly", {
        value: true,
        writable: true,
      });
      const student = await saveFakeStudent(db.dataSource);

      // Mock user services for a BCSC user.
      await mockUserLoginInfo(appModule, student);

      const endpoint = "/students/student";
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNAUTHORIZED);
    },
  );

  it("Should allow BCSC beta user to access the application when user is registered in beta users authorizations table.", async () => {
    // Arrange
    Object.defineProperty(configService, "allowBetaUsersOnly", {
      value: true,
      writable: true,
    });
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services for a BCSC user.
    await mockUserLoginInfo(appModule, student);

    const endpoint = "/students/student";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const jwtService = new JwtService();
    const decodedToken = jwtService.decode(token);

    // Register user in beta users authorizations table.
    await db.betaUsersAuthorizations.save({
      givenNames: decodedToken.givenNames,
      lastName: decodedToken.lastName,
    });

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
  });

  it("Endpoint with Public decorator should allow access when the bearer token is not present", () => {
    return request(app.getHttpServer())
      .get("/auth-test/public-route")
      .expect(HttpStatus.OK);
  });

  describe("Endpoint that requires authentication", () => {
    it("Should return a HttpStatus UNAUTHORIZED(401) when bearer token is not present", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should return a HttpStatus OK(200) when bearer token is present", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth(studentAccessToken, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus UNAUTHORIZED(401) when bearer token is present but it is invalid", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth("invalid_token", { type: "bearer" })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should return a HttpStatus OK(200) when the Role decorator is present and the role is present and it is the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-role")
        .auth(aestAccessToken, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus FORBIDDEN(403) when the Role decorator is present but the role it is not the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-non-existing-role")
        .auth(studentAccessToken, { type: "bearer" })
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Should return a HttpStatus OK(200) when the Group decorator is present and the group is present and it is the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-group")
        .auth(aestAccessToken, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus FORBIDDEN(403) when the Group decorator is present but the group it is not the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-non-existing-group")
        .auth(aestAccessToken, { type: "bearer" })
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Can parse the UserToken", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth(studentAccessToken, { type: "bearer" })
        .expect(HttpStatus.OK)
        .then((resp) => {
          // Only the basic properties that are present in a basic
          // Keycloak user are being validated here.
          expect(resp.body).toBeDefined();
          expect(resp.body.userName).toBeTruthy();
          expect(resp.body.email).toBeTruthy();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
