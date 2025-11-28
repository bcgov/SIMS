import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { AppModule } from "../../../app.module";
import { AuthTestController } from "../../../testHelpers/controllers/auth-test/auth-test.controller";
import { createZeebeModuleMock } from "@sims/test-utils/mocks";
import {
  BEARER_AUTH_TYPE,
  getAESTToken,
  getExternalUserToken,
  getInstitutionToken,
  getStudentToken,
  FakeStudentUsersTypes,
  InstitutionTokenTypes,
} from "../../../testHelpers";

describe("MaintenanceModeGuard (e2e)", () => {
  const originalEnv = process.env;

  /**
   * Initialize a fresh Nest application with custom environment variables.
   * This ensures ConfigService reads the correct maintenance flags.
   * @param overrides environment variable overrides.
   * @returns initialized Nest application.
   */
  async function initAppWithEnv(
    overrides: Partial<NodeJS.ProcessEnv>,
  ): Promise<INestApplication> {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ...overrides,
    };
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      controllers: [AuthTestController],
    }).compile();
    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("AllowDuringMaintenanceMode decorator", () => {
    it("Should allow @Public route when global maintenance is ON", async () => {
      const app = await initAppWithEnv({ MAINTENANCE_MODE: "true" });
      await request(app.getHttpServer())
        .get("/auth-test/public-route")
        .expect(HttpStatus.OK);
      await app.close();
    });

    it("Should allow @Public route when all maintenance flags are ON", async () => {
      const app = await initAppWithEnv({
        MAINTENANCE_MODE: "false",
        MAINTENANCE_MODE_STUDENT: "true",
        MAINTENANCE_MODE_INSTITUTION: "true",
        MAINTENANCE_MODE_MINISTRY: "true",
        MAINTENANCE_MODE_SUPPORTING_USER: "true",
        MAINTENANCE_MODE_EXTERNAL: "true",
      });
      await request(app.getHttpServer())
        .get("/auth-test/public-route")
        .expect(HttpStatus.OK);
      await app.close();
    });
  });

  describe("Student maintenance mode", () => {
    it("Should block Student when MAINTENANCE_MODE_STUDENT is ON", async () => {
      const app = await initAppWithEnv({ MAINTENANCE_MODE_STUDENT: "true" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE_STUDENT: "false" });
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

  describe("Institution maintenance mode", () => {
    it("Should block Institution when MAINTENANCE_MODE_INSTITUTION is ON", async () => {
      const app = await initAppWithEnv({
        MAINTENANCE_MODE_INSTITUTION: "true",
      });
      const institutionToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      await request(app.getHttpServer())
        .get("/auth-test/user-not-required-route")
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
      const app = await initAppWithEnv({
        MAINTENANCE_MODE_INSTITUTION: "false",
      });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE_MINISTRY: "true" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE_MINISTRY: "false" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE_EXTERNAL: "true" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE_EXTERNAL: "false" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE: "true" });
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
      const app = await initAppWithEnv({ MAINTENANCE_MODE: "false" });
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
      const app = await initAppWithEnv({
        MAINTENANCE_MODE: "false",
        MAINTENANCE_MODE_STUDENT: "true",
      });
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
      const app = await initAppWithEnv({
        MAINTENANCE_MODE_STUDENT: "true",
        MAINTENANCE_MODE_INSTITUTION: "false",
      });
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
