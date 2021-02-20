import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthConfig } from "../src/auth/auth-config";
import {
  PEM_BEGIN_HEADER,
  PEM_END_HEADER,
} from "../src/utilities/certificate-utils";
import { AuthTestController } from "../src/route-controllers/auth-test/auth-test.controller";
import { ConfigService } from "../src/services";
import { KeycloakService } from "../src/services/auth/keycloak/keycloak.service";

describe("Authentication (e2e)", () => {
  // Use the student client to retrieve the token from
  // Keycloak since it is the only one that we have currently.
  const clientId = "student";
  const config = new ConfigService().getConfig();
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for all e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from Keyclock.
  let accesstoken: string;

  beforeAll(async () => {
    await AuthConfig.load();
    const token = await KeycloakService.shared.getToken(
      config.e2eTest.studentUser.username,
      config.e2eTest.studentUser.password,
      clientId,
    );
    accesstoken = token.access_token;

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
    await AuthConfig.load();

    // Assert
    expect(AuthConfig.PEM_PublicKey).toContain(PEM_BEGIN_HEADER);
    expect(AuthConfig.PEM_PublicKey).toContain(PEM_END_HEADER);
    // Besides that header and footer, the public_key need have some additional
    // content that would be the public key retrieve fromKeycloak,
    // that does not contains the PEM_BEGIN_HEADER and PEM_END_HEADER.
    expect(AuthConfig.PEM_PublicKey.length).toBeGreaterThan(
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
        .auth(accesstoken, { type: "bearer" })
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
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus FORBIDDEN(403) when the Role decorator is present but the role it is not the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-non-existing-role")
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Can parse the UserToken", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.OK)
        .then((resp) => {
          // Only the basic properties that are present in a basic
          // Keycloak user are being validated here.
          expect(resp.body).toBeDefined();
          expect(resp.body.userName).toBeTruthy();
          expect(resp.body.email).toBeTruthy();
          expect(resp.body.scope).toBeTruthy();
          expect(resp.body.roles).toBeTruthy();
          expect(resp.body.roles.length).toBeGreaterThan(0);
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
