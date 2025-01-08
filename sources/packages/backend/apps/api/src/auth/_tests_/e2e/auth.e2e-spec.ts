import { Test, TestingModule } from "@nestjs/testing";
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
  createFakeInstitutionLocation,
  E2EDataSources,
  getProviderInstanceForModule,
} from "@sims/test-utils";
import { ConfigModule, ConfigService } from "@sims/utilities/config";
import { createZeebeModuleMock } from "@sims/test-utils/mocks";
import { AppModule } from "../../../app.module";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { DataSource } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { INVALID_BETA_USER, MISSING_USER_ACCOUNT } from "../../../constants";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
  mockUserLoginInfo,
  resetMockUserLoginInfo,
} from "../../../testHelpers";
import * as dayjs from "dayjs";
import { InstitutionUserTypes, Student, User } from "@sims/sims-db";

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
  let configService: ConfigService;
  let db: E2EDataSources;
  let studentDecodedToken: any;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const studentToken = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      "student",
    );
    studentAccessToken = studentToken.access_token;
    const jwtService = new JwtService();
    studentDecodedToken = jwtService.decode(studentAccessToken);

    const aestToken = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      "aest",
    );
    aestAccessToken = aestToken.access_token;

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      // AuthTestController is used only for e2e tests and could be
      // changed as needed to implement more test scenarios.
      //controllers: [AuthTestController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    const dataSource = moduleFixture.get(DataSource);
    db = createE2EDataSources(dataSource);

    configService = await getProviderInstanceForModule(
      moduleFixture,
      ConfigModule,
      ConfigService,
    );
  });

  beforeEach(async () => {
    // By default all users will be allowed to access the system.
    jest
      .spyOn(configService, "allowBetaUsersOnly", "get")
      .mockReturnValue(false);
    // Reset mock user login info.
    await resetMockUserLoginInfo(moduleFixture);
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
    "Should allow BCSC user to access the application when user is not registered in beta users authorizations table but " +
      "config allows any user to access the application.",
    async () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-student")
        .auth(studentAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    },
  );

  it(
    "Should not allow BCSC beta user to access the application when config allows only beta users to access the application but " +
      "user is not registered in beta users authorizations table.",
    async () => {
      // Arrange
      jest
        .spyOn(configService, "allowBetaUsersOnly", "get")
        .mockReturnValue(true);
      // Act/Assert
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-student")
        .auth(studentAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          message: "The student is not registered as a beta user.",
          errorType: INVALID_BETA_USER,
        });
    },
  );

  it(
    "Should allow BCSC beta user to access the application when config allows only beta users to access the application and " +
      "user is registered in beta users authorizations table.",
    async () => {
      // Arrange
      jest
        .spyOn(configService, "allowBetaUsersOnly", "get")
        .mockReturnValue(true);

      // Add user to beta users authorizations table in upper case to test the query.
      await db.betaUsersAuthorizations.save({
        givenNames: studentDecodedToken.givenNames.toUpperCase(),
        lastName: studentDecodedToken.lastName.toUpperCase(),
      });

      // Act/Assert
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-student")
        .auth(studentAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    },
  );

  it(
    "Should not allow BCSC beta user to access the application when config allows only beta users to access the application and " +
      "user is registered in beta users authorizations table with a future date to be enabled.",
    async () => {
      // Arrange
      jest
        .spyOn(configService, "allowBetaUsersOnly", "get")
        .mockReturnValue(true);

      const tomorrow = dayjs().add(1, "day");
      const betaUsersAuthorizations =
        await db.betaUsersAuthorizations.findOneBy({
          givenNames: studentDecodedToken.givenNames.toUpperCase(),
          lastName: studentDecodedToken.lastName.toUpperCase(),
        });
      betaUsersAuthorizations.enabledFrom = tomorrow.toDate();
      // Save beta users authorizations with tomorrow's date.
      await db.betaUsersAuthorizations.save(betaUsersAuthorizations);

      // Act/Assert
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-student")
        .auth(studentAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect({
          message: "The student is not registered as a beta user.",
          errorType: INVALID_BETA_USER,
        });
    },
  );

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

    it(
      "Should return a HttpStatus FORBIDDEN(403) when there is no user account associated to the user token " +
        "to a default route that requires a user account.",
      async () => {
        await mockUserLoginInfo(moduleFixture, {
          id: null,
          user: { id: null, isActive: null } as User,
        } as Student);
        return request(app.getHttpServer())
          .get("/auth-test/default-requires-user-route")
          .auth(studentAccessToken, { type: "bearer" })
          .expect(HttpStatus.FORBIDDEN)
          .expect({
            message: "No user account has been associated to the user token.",
            errorType: MISSING_USER_ACCOUNT,
          });
      },
    );

    it(
      "Should return a HttpStatus OK(200) when there is no user account associated to the user token " +
        "to a route that does not requires a user account.",
      async () => {
        await mockUserLoginInfo(moduleFixture, {
          id: null,
          user: { id: null, isActive: null } as User,
        } as Student);
        return request(app.getHttpServer())
          .get("/auth-test/user-not-required-route")
          .auth(studentAccessToken, { type: "bearer" })
          .expect(HttpStatus.OK);
      },
    );

    it("Should return a HttpStatus OK(200) when a read-only institution user tries to access a read-only route to their institution.", async () => {
      // Arrange
      const { institution: collegeE } = await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
      );
      const collegeELocation = createFakeInstitutionLocation({
        institution: collegeE,
      });
      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
        collegeELocation,
        InstitutionUserTypes.readOnlyUser,
      );
      const endpoint = `/auth-test/institution-location-reading-route/${collegeELocation.id}`;
      const collegEInstitutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeEReadOnlyUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(collegEInstitutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });

    it.only("Should return a HttpStatus FORBIDDEN(403) when a read-only institution user tries to access a non-reading-only route to their institution.", async () => {
      // Arrange

      console.log("Before getAuthRelatedEntities !#@$!%$&");
      const { institution: collegeE } = await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
      );
      console.log("Before createFakeInstitutionLocation !#$%%^%*&(*");
      const collegeELocation = createFakeInstitutionLocation({
        institution: collegeE,
      });
      console.log("collegeELocation:", collegeELocation);
      console.log("Before authorizeUserTokenForLocation !#$%%^%*&(*");
      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
        collegeELocation,
        InstitutionUserTypes.readOnlyUser,
      );
      const endpoint = `/auth-test/institution-location-modifying-route/${collegeELocation.id}`;
      console.log("Before getInstitutionToken !#$%%^%*&(*");
      const collegEInstitutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeEReadOnlyUser,
      );
      console.log(
        "collegEInstitutionUserToken:",
        collegEInstitutionUserToken.substring(0, 10),
      );
      console.log("Before request !#$%%^%*&(*");
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(collegEInstitutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
