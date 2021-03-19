require("../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { KeycloakConfig } from "../src/auth/keycloakConfig";
import { KeycloakService } from "../src/services/auth/keycloak/keycloak.service";

describe("Institution controller (e2e)", () => {
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
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      clientId,
    );
    accesstoken = token.access_token;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  //IN progress- Will unskip once there is a delete user in place to that this test can be run idempotently.
  describe.skip("save institution", () => {
    it("Should return a HttpStatus OK(200) with institution information when user is valid and user doesnt exist", () => {
      return request(app.getHttpServer())
        .post("/institution")
        .auth(accesstoken, { type: "bearer" })
        .send({
          legalOperatingName: "E2ETest",
          operatingName: "Test",
          primaryPhone: "Test",
          primaryEmail: "Test",
          website: "Test",
          regulatingBody: "Test",
          establishedDate: "2021-03-01",
          primaryContactFirstName: "Test",
          primaryContactLastName: "Test",
          primaryContactEmail: "Test",
          primaryContactPhone: "Test",
          legalAuthorityFirstName: "Test",
          legalAuthorityLastName: "Test",
          legalAuthorityEmail: "Test",
          legalAuthorityPhone: "Test",
          addressLine1: "Test",
          addressLine2: "Test",
          city: "Test",
          provinceState: "Test",
          country: "Test",
          postalCode: "Test",
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(HttpStatus.CREATED);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
