import { HttpStatus, INestApplication } from "@nestjs/common";

import { createTestingConfigModule } from "../../../../testHelpers";
import * as request from "supertest";
import { ConfigAPIOutDTO } from "../../models/config.dto";

describe("ConfigController(e2e)-getConfig", () => {
  let app: INestApplication;
  const originalEnv = process.env;
  const fakeEnvVariables = {
    KEYCLOAK_AUTH_URL: "https://keycloak-fake-url",
    KEYCLOAK_REALM: "keycloak_fake_realm",
    KEYCLOAK_CLIENT_STUDENT: "student",
    KEYCLOAK_CLIENT_INSTITUTION: "institution",
    KEYCLOAK_CLIENT_AEST: "aest",
    KEYCLOAK_CLIENT_SUPPORTING_USERS: "supporting-users",
    SITE_MINDER_LOGOUT_URL: "https://fake-siteminder-logout-url",
  };

  beforeAll(async () => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      ...fakeEnvVariables,
    };
    const { nestApplication } = await createTestingConfigModule();
    app = nestApplication;
  });

  it("Should return config values", async () => {
    // Arrange Act/Assert
    await request(app.getHttpServer())
      .get("/config")
      .expect(HttpStatus.OK)
      .then((response) => {
        const config = response.body as ConfigAPIOutDTO;
        expect(config.auth.url).toBe(fakeEnvVariables.KEYCLOAK_AUTH_URL);
        expect(config.auth.realm).toBe(fakeEnvVariables.KEYCLOAK_REALM);
        expect(config.auth.externalSiteMinderLogoutUrl).toBe(
          fakeEnvVariables.SITE_MINDER_LOGOUT_URL,
        );
        expect(config.auth.clientIds.student).toBe(
          fakeEnvVariables.KEYCLOAK_CLIENT_STUDENT,
        );
        expect(config.auth.clientIds.institution).toBe(
          fakeEnvVariables.KEYCLOAK_CLIENT_INSTITUTION,
        );
        expect(config.auth.clientIds.aest).toBe(
          fakeEnvVariables.KEYCLOAK_CLIENT_AEST,
        );
        expect(config.auth.clientIds.supportingUsers).toBe(
          fakeEnvVariables.KEYCLOAK_CLIENT_SUPPORTING_USERS,
        );
      });
  });

  afterAll(async () => {
    process.env = originalEnv;
    await app?.close();
  });
});
