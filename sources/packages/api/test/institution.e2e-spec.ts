require("../env_setup");
import jwtDecode from "jwt-decode";
import * as faker from "faker";

import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { KeycloakConfig } from "../src/auth/keycloakConfig";
import { KeycloakService } from "../src/services/auth/keycloak/keycloak.service";
import {
  InstitutionLocationService,
  InstitutionService,
  UserService,
} from "../src/services";
import {
  institutionFactory,
  institutionLocationFactory,
  userFactory,
} from "../src/database/factories";
import { InstitutionUserType } from "../src/types";

// Setting longer timeout because this test is connecting external system
jest.setTimeout(15000);
describe("Institution controller (e2e)", () => {
  const clientId = "student";
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for all e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from Keyclock.
  let accessToken: string;
  let institutionService: InstitutionService;
  let locationService: InstitutionLocationService;
  let userService: UserService;
  let parsedToken: any;

  beforeAll(async () => {
    await KeycloakConfig.load();
    const token = await KeycloakService.shared.getToken(
      process.env.E2E_TEST_STUDENT_USERNAME,
      process.env.E2E_TEST_STUDENT_PASSWORD,
      clientId,
    );
    accessToken = token.access_token;
    parsedToken = jwtDecode(accessToken);

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

    institutionService = app.get<InstitutionService>(InstitutionService);
    locationService = app.get<InstitutionLocationService>(
      InstitutionLocationService,
    );
    userService = app.get<UserService>(UserService);
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

  it("should Create institution user", async () => {
    // Create institution
    const institution = await institutionFactory();
    const location = await institutionLocationFactory();
    const user = await userFactory({
      userName: parsedToken.userName,
    });
    await institutionService.save(institution);
    location.institution = institution;
    await locationService.save(location);
    const existing = await userService.getUser(user.userName);
    if (!existing) {
      await userService.save(user);
      await institutionService.createAssociation({
        institution,
        user,
        type: InstitutionUserType.admin,
      });
    } else {
      await institutionService.createAssociation({
        institution,
        user: existing,
        type: InstitutionUserType.admin,
      });
    }
    await request(app.getHttpServer())
      .post("/institution/user")
      .auth(accessToken, { type: "bearer" })
      .send({
        locationId: location.id,
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        userGuid: faker.random.uuid(),
        userType: InstitutionUserType.user,
      })
      .set("Accept", "application/json")
      .expect(HttpStatus.CREATED);

    await locationService.remove(location);
    await institutionService.remove(institution);
    await userService.remove(existing || user);
  });

  afterAll(async () => {
    await app.close();
  });
});
