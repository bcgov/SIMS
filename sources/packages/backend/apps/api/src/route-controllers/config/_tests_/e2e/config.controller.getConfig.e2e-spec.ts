import { HttpStatus, INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@sims/utilities/config";
import { setGlobalPipes } from "../../../../utilities";
import { CreateTestingModuleResult } from "../../../../testHelpers";
import * as request from "supertest";
import { ConfigController } from "../../config.controller";

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
      .expect({
        auth: {
          url: fakeEnvVariables.KEYCLOAK_AUTH_URL,
          realm: fakeEnvVariables.KEYCLOAK_REALM,
          clientIds: {
            student: fakeEnvVariables.KEYCLOAK_CLIENT_STUDENT,
            institution: fakeEnvVariables.KEYCLOAK_CLIENT_INSTITUTION,
            aest: fakeEnvVariables.KEYCLOAK_CLIENT_AEST,
            supportingUsers: fakeEnvVariables.KEYCLOAK_CLIENT_SUPPORTING_USERS,
          },
          externalSiteMinderLogoutUrl: fakeEnvVariables.SITE_MINDER_LOGOUT_URL,
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * API root module only with config module and config controller.
 ** This module allows to mock any environment variable including
 ** keycloak environment variables.
 ** This module is exclusively for Config e2e tests.
 * @returns test config module as root application module.
 */
export async function createTestingConfigModule(): Promise<CreateTestingModuleResult> {
  const module: TestingModule = await Test.createTestingModule({
    imports: [ConfigModule],
    controllers: [ConfigController],
  }).compile();
  const nestApplication = module.createNestApplication();
  setGlobalPipes(nestApplication);
  await nestApplication.init();
  return {
    nestApplication,
    module,
  } as CreateTestingModuleResult;
}
