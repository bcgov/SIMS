import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "@sims/auth/config";
import { KeycloakService } from "@sims/auth/services";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { UserPasswordCredential } from "@sims/utilities/config";
import { createZeebeModuleMock } from "@sims/test-utils/mocks";
import { AppModule } from "../../../app.module";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  FakeStudentUsersTypes,
  getAESTToken,
  getAuthorizedLocation,
  getExternalUserToken,
  getInstitutionToken,
  getStudentToken,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import { AuthTestController } from "../../../testHelpers/controllers/auth-test/auth-test.controller";
import { InstitutionUserTypes } from "@sims/sims-db";

describe("MaintenanceModeGuard (e2e)", () => {
  const originalEnv = process.env;
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
  let moduleFixture: TestingModule;
  let db: E2EDataSources;

  beforeEach(async () => {
    await KeycloakConfig.load();
    const userPasswordCredentialStudent: UserPasswordCredential = {
      userName: process.env.E2E_TEST_STUDENT_USERNAME,
      password: process.env.E2E_TEST_STUDENT_PASSWORD,
    };
    const studentToken = await KeycloakService.shared.getToken("student", {
      userPasswordCredential: userPasswordCredentialStudent,
    });
    studentAccessToken = studentToken.access_token;

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

  afterEach(() => {
    process.env = originalEnv;
    app.close();
  });

  describe("AllowDuringMaintenanceMode decorator", () => {
    it("Should allow @AllowDuringMaintenanceMode route when global maintenance is ON", async () => {
      process.env.MAINTENANCE_MODE = "true";
      await request(app.getHttpServer()).get("/config").expect(HttpStatus.OK);
      await app.close();
    });

    it("Should allow @Public route when all maintenance flags are ON", async () => {
      process.env.MAINTENANCE_MODE = "false";
      process.env.MAINTENANCE_MODE_STUDENT = "true";
      process.env.MAINTENANCE_MODE_INSTITUTION = "true";
      process.env.MAINTENANCE_MODE_MINISTRY = "true";
      process.env.MAINTENANCE_MODE_SUPPORTING_USER = "true";
      process.env.MAINTENANCE_MODE_EXTERNAL = "true";
      await request(app.getHttpServer())
        .get("/auth-test/public-route")
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("Student maintenance mode", () => {
    it("Should block Student when MAINTENANCE_MODE_STUDENT is ON", async () => {
      process.env.MAINTENANCE_MODE_STUDENT = "true";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE)
        .expect({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
          error: "Service Unavailable",
        });
      await app.close();
    });

    it("Should allow Student when MAINTENANCE_MODE_STUDENT is OFF", async () => {
      process.env.MAINTENANCE_MODE_STUDENT = "false";
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentAccessToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("Institution maintenance mode", () => {
    it("Should block Institution when MAINTENANCE_MODE_INSTITUTION is ON", async () => {
      process.env.MAINTENANCE_MODE_INSTITUTION = "true";
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      const collegeELocation = await getAuthorizedLocation(
        db,
        InstitutionTokenTypes.CollegeEReadOnlyUser,
        InstitutionUserTypes.readOnlyUser,
      );
      const endpoint = `/auth-test/institution-location-reading-route/${collegeELocation.id}`;

      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE)
        .expect({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
          error: "Service Unavailable",
        });
      await app.close();
    });

    it("Should allow Institution when MAINTENANCE_MODE_INSTITUTION is OFF", async () => {
      process.env.MAINTENANCE_MODE_INSTITUTION = "false";
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(institutionToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("AEST (Ministry) maintenance mode", () => {
    it("Should block AEST when MAINTENANCE_MODE_MINISTRY is ON", async () => {
      process.env.MAINTENANCE_MODE_MINISTRY = "true";
      const aestToken = await getAESTToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(aestToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE)
        .expect({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
          error: "Service Unavailable",
        });
      await app.close();
    });

    it("Should allow AEST when MAINTENANCE_MODE_MINISTRY is OFF", async () => {
      process.env.MAINTENANCE_MODE_MINISTRY = "false";
      const aestToken = await getAESTToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(aestToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("External maintenance mode", () => {
    it("Should block External when MAINTENANCE_MODE_EXTERNAL is ON", async () => {
      process.env.MAINTENANCE_MODE_EXTERNAL = "true";
      const externalToken = await getExternalUserToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(externalToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE)
        .expect({
          statusCode: HttpStatus.SERVICE_UNAVAILABLE,
          message:
            "Service temporarily unavailable for maintenance. Please try again later or contact support if the issue persists.",
          error: "Service Unavailable",
        });
      await app.close();
    });

    it("Should allow External when MAINTENANCE_MODE_EXTERNAL is OFF", async () => {
      process.env.MAINTENANCE_MODE_EXTERNAL = "false";
      const externalToken = await getExternalUserToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(externalToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("Global maintenance mode", () => {
    it("Should block all authenticated parties when MAINTENANCE_MODE (global) is ON", async () => {
      process.env.MAINTENANCE_MODE = "true";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE);
      await app.close();
    });

    it("Should allow all parties when MAINTENANCE_MODE (global) is OFF", async () => {
      process.env.MAINTENANCE_MODE = "false";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("Mixed scenarios", () => {
    it("Should block Student when global maintenance is OFF but MAINTENANCE_MODE_STUDENT is ON", async () => {
      process.env.MAINTENANCE_MODE = "false";
      process.env.MAINTENANCE_MODE_STUDENT = "true";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE);
      await app.close();
    });

    it("Should allow Institution when only MAINTENANCE_MODE_STUDENT is ON", async () => {
      process.env.MAINTENANCE_MODE_STUDENT = "true";
      process.env.MAINTENANCE_MODE_INSTITUTION = "false";
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(institutionToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      await app.close();
    });
  });
});
