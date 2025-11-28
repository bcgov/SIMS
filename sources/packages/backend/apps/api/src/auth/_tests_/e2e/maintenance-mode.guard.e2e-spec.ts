import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { KeycloakConfig } from "@sims/auth/config";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import {
  createZeebeModuleMock,
  ConfigServiceMockHelper,
} from "@sims/test-utils/mocks";
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
  // Nest application to be shared for all e2e tests
  // that need execute a HTTP request.
  let app: INestApplication;
  // Token to be used for AEST e2e tests that need test
  // the authentication endpoints.
  // This token is retrieved from KeyCloak.
  let moduleFixture: TestingModule;
  let db: E2EDataSources;
  let configServiceMockHelper: ConfigServiceMockHelper;

  beforeAll(async () => {
    await KeycloakConfig.load();
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      // AuthTestController is used only for e2e tests and could be
      // changed as needed to implement more test scenarios.
      controllers: [AuthTestController],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.init();
    const dataSource = moduleFixture.get(DataSource);
    db = createE2EDataSources(dataSource);
    configServiceMockHelper = new ConfigServiceMockHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe("AllowDuringMaintenanceMode decorator", () => {
    it("Should allow @AllowDuringMaintenanceMode route when global maintenance is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({ maintenanceMode: true });
      await request(app.getHttpServer()).get("/config").expect(HttpStatus.OK);
    });

    it("Should allow @Public route when all maintenance flags are ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceMode: false,
        maintenanceModeStudent: true,
        maintenanceModeInstitution: true,
        maintenanceModeMinistry: true,
        maintenanceModeSupportingUser: true,
        maintenanceModeExternal: true,
      });
      await request(app.getHttpServer())
        .get("/auth-test/public-route")
        .expect(HttpStatus.OK);
    });
  });

  describe("Student maintenance mode", () => {
    it("Should block Student when MAINTENANCE_MODE_STUDENT is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeStudent: true,
      });
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
    });

    it("Should allow Student when MAINTENANCE_MODE_STUDENT is OFF", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeStudent: false,
      });
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });

  describe("Institution maintenance mode", () => {
    it("Should block Institution when MAINTENANCE_MODE_INSTITUTION is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeInstitution: true,
      });
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
    });

    it("Should allow Institution when MAINTENANCE_MODE_INSTITUTION is OFF", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeInstitution: false,
      });
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(institutionToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });

  describe("AEST (Ministry) maintenance mode", () => {
    it("Should block AEST when MAINTENANCE_MODE_MINISTRY is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeMinistry: true,
      });
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
    });

    it("Should allow AEST when MAINTENANCE_MODE_MINISTRY is OFF", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeMinistry: false,
      });
      const aestToken = await getAESTToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(aestToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });

  describe("External maintenance mode", () => {
    it("Should block External when MAINTENANCE_MODE_EXTERNAL is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeExternal: true,
      });
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
    });

    it("Should allow External when MAINTENANCE_MODE_EXTERNAL is OFF", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeExternal: false,
      });
      const externalToken = await getExternalUserToken();
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(externalToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });

  describe("Global maintenance mode", () => {
    it("Should block all authenticated parties when MAINTENANCE_MODE (global) is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({ maintenanceMode: true });
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it("Should allow all parties when MAINTENANCE_MODE (global) is OFF", async () => {
      configServiceMockHelper.setMaintenanceMode({ maintenanceMode: false });
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });

  describe("Mixed scenarios", () => {
    it("Should block Student when global maintenance is OFF but MAINTENANCE_MODE_STUDENT is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceMode: false,
        maintenanceModeStudent: true,
      });
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it("Should allow Institution when only MAINTENANCE_MODE_STUDENT is ON", async () => {
      configServiceMockHelper.setMaintenanceMode({
        maintenanceModeStudent: true,
        maintenanceModeInstitution: false,
      });
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
        .auth(institutionToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
    });
  });
});
