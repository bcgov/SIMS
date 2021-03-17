require("../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { KeycloakConfig } from "../src/auth/keycloakConfig";
import { KeycloakService } from "../src/services/auth/keycloak/keycloak.service";

describe.skip("Users controller (e2e)", () => {
  // Use the student client to retrieve the token from.
  // The BCeID user is a Keyclock user, so doesn't matter
  // from which client it will be retrieved.
  const clientId = "student";
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for all e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from Keyclock.
  let accesstoken: string;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_BCeID_USERNAME,
      process.env.E2E_TEST_BCeID_PASSWORD,
      clientId,
    );
    accesstoken = token.access_token;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe.skip("bceid-account route", () => {
    it("Should return a HttpStatus OK(200) with user account information when user is valid", () => {
      return request(app.getHttpServer())
        .get("/users/bceid-account")
        .auth(accesstoken, { type: "bearer" })
        .expect(HttpStatus.OK)
        .then((resp) => {
          expect(resp.body).toBeDefined();
          expect(resp.body.user).toBeDefined();
          expect(resp.body.user.guid).toBeTruthy();
          expect(resp.body.user.displayName).toBeTruthy();
          expect(resp.body.user.firstname).toBeTruthy();
          expect(resp.body.user.surname).toBeTruthy();
          expect(resp.body.user.email).toBeTruthy();
          expect(resp.body.institution).toBeDefined();
          expect(resp.body.institution.guid).toBeTruthy();
          expect(resp.body.institution.legalName).toBeTruthy();
        });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
