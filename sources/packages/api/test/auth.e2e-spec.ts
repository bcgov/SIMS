import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import {
  AuthHelper,
  PEM_BEGIN_HEADER,
  PEM_END_HEADER,
} from "../src/auth/auth-helper";
import { AuthTestController } from "../src/route-controllers/auth-test/auth-test.controller";

describe("Authentication (e2e)", () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    await AuthHelper.load();
    token = await AuthHelper.getAccessToken(
      "to be defined",
      "to be defined",
      "student",
    );

    console.log(AuthHelper.realmConfig.public_key);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    await AuthHelper.load();

    // Assert
    expect(AuthHelper.realmConfig.public_key).toContain(PEM_BEGIN_HEADER);
    expect(AuthHelper.realmConfig.public_key).toContain(PEM_END_HEADER);
    expect(AuthHelper.realmConfig.public_key.length).toBeGreaterThan(
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
        .auth(token, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus UNAUTHORIZED(401) when bearer token is present but it is invalid", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth("invalid_token", { type: "bearer" })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it("Should return a HttpStatus OK(200) when the Role decorator is present and the role is present", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-role")
        .auth(token, { type: "bearer" })
        .expect(HttpStatus.OK);
    });

    it("Should return a HttpStatus FORBIDDEN(403) when the Role decorator is present but it is not the expected one", () => {
      return request(app.getHttpServer())
        .get("/auth-test/authenticated-route-by-non-existing-role")
        .auth(token, { type: "bearer" })
        .expect(HttpStatus.FORBIDDEN);
    });

    it("Can parse the UserToken", () => {
      return request(app.getHttpServer())
        .get("/auth-test/global-authenticated-route")
        .auth(token, { type: "bearer" })
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
