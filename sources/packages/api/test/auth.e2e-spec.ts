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

  it("Endpoint that requires authentication should return a HttpStatus 401 when bearer token is not present", () => {
    return request(app.getHttpServer())
      .get("/auth-test/authenticated-route")
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it("Endpoint that requires authentication should return a HttpStatus 200 when bearer token is present", () => {
    return request(app.getHttpServer())
      .get("/auth-test/authenticated-route")
      .auth(token, { type: "bearer" })
      .expect(HttpStatus.OK);
  });

  afterAll(async () => {
    await app.close();
  });
});
