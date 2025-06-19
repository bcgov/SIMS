import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "@sims/auth/config";
import { KeycloakService } from "@sims/auth/services";
import {
  PEM_BEGIN_HEADER,
  PEM_END_HEADER,
} from "@sims/auth/utilities/certificate-utils";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { UserPasswordCredential } from "@sims/utilities/config";
import { createZeebeModuleMock } from "@sims/test-utils/mocks";
import { AppModule } from "../../../app.module";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { DataSource } from "typeorm";
import { MISSING_USER_ACCOUNT } from "../../../constants";
import {
  BEARER_AUTH_TYPE,
  getAuthorizedLocation,
  InstitutionTokenTypes,
  mockUserLoginInfo,
  resetMockUserLoginInfo,
} from "../../../testHelpers";
import { Student, User } from "@sims/sims-db";
import { AuthTestController } from "../../../testHelpers/controllers/auth-test/auth-test.controller";
import { SIMS2_COLLE_USER } from "@sims/test-utils/constants";
import { InstitutionUserTypes } from "../../user-types.enum";

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
  let db: E2EDataSources;
  let moduleFixture: TestingModule;
  let collegEInstitutionReadOnlyUserAccessToken: string;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const userPasswordCredentialStudent: UserPasswordCredential = {
      userName: process.env.E2E_TEST_STUDENT_USERNAME,
      password: process.env.E2E_TEST_STUDENT_PASSWORD,
    };
    const studentToken = await KeycloakService.shared.getToken("student", {
      userPasswordCredential: userPasswordCredentialStudent,
    });
    studentAccessToken = studentToken.access_token;
    const aestToken = await KeycloakService.shared.getToken("aest", {
      userPasswordCredential: userPasswordCredentialStudent,
    });
    aestAccessToken = aestToken.access_token;

    const userPasswordCredentialInstitution: UserPasswordCredential = {
      userName: SIMS2_COLLE_USER,
      password: process.env.E2E_TEST_PASSWORD,
    };
    const collegEToken = await KeycloakService.shared.getToken("institution", {
      userPasswordCredential: userPasswordCredentialInstitution,
    });
    collegEInstitutionReadOnlyUserAccessToken = collegEToken.access_token;

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      // AuthTestController is used only for e2e tests and could be
      // changed as needed to implement more test scenarios.
      controllers: [AuthTestController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    const dataSource = moduleFixture.get(DataSource);
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
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
      const collegeELocation = await getAuthorizedLocation(
        db,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
        InstitutionUserTypes.readOnlyUser,
      );
      const endpoint = `/auth-test/institution-location-reading-route/${collegeELocation.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(collegEInstitutionReadOnlyUserAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus FORBIDDEN(403) when a read-only institution user tries to access a non-reading-only route to their institution.", async () => {
      // Arrange
      const collegeELocation = await getAuthorizedLocation(
        db,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
        InstitutionUserTypes.readOnlyUser,
      );
      const endpoint = `/auth-test/institution-location-modifying-route/${collegeELocation.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(collegEInstitutionReadOnlyUserAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.FORBIDDEN)
        .expect({
          statusCode: HttpStatus.FORBIDDEN,
          message: "Forbidden resource",
          error: "Forbidden",
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
