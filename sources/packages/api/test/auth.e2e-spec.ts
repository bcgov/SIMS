require("../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { KeycloakConfig } from "../src/auth/keycloakConfig";
import {
  PEM_BEGIN_HEADER,
  PEM_END_HEADER,
} from "../src/utilities/certificate-utils";
import { AuthTestController } from "../src/testHelpers/controllers/auth-test/auth-test.controller";
import { KeycloakService } from "../src/services/auth/keycloak/keycloak.service";

jest.setTimeout(10000);

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

  beforeAll(async () => {
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      // AuthTestController is used only for e2e tests and could be
      // changed as needed to implement more test scenarios.
      controllers: [AuthTestController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
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
          expect(resp.body.scope).toBeTruthy();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
