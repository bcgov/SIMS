import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { KeycloakConfig } from "@sims/auth/config";
import { KeycloakService } from "@sims/auth/services";
import { UserPasswordCredential } from "@sims/utilities/config";

describe("Institution controller (e2e)", () => {
  const clientId = "student";
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for all e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from Keyclock.
  let accessToken: string;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const userPasswordCredential: UserPasswordCredential = {
      userName: process.env.E2E_TEST_STUDENT_USERNAME,
      password: process.env.E2E_TEST_STUDENT_PASSWORD,
    };
    const token = await KeycloakService.shared.getToken(clientId, {
      userPasswordCredential,
    });
    accessToken = token.access_token;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        disableErrorMessages: false,
      }),
    );
    await app.init();
  });

  describe.skip("save institution", () => {
    it("Should return a HttpStatus OK(200) with institution information when user is valid and user doesnt exist", () => {
      return request(app.getHttpServer())
        .post("/institution")
        .auth(accessToken, { type: "bearer" })
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
