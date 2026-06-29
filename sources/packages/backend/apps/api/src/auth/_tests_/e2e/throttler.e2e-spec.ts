import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import { KeycloakConfig } from "@sims/auth/config";
import { createZeebeModuleMock } from "@sims/test-utils/mocks";
import { AppModule } from "../../../app.module";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import {
  AESTAuthTestController,
  AuthTestController,
} from "../../../testHelpers/controllers/auth-test/auth-test.controller";

describe("Guards and Decorators - Throttler (e2e)", () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  const defaultThrottleLimit = 10;
  const aestThrottleLimit = 4;

  beforeAll(async () => {
    // Keep THROTTLE_TIME and THROTTLE_LIMIT low for testing purposes
    // avoiding consuming its values from the global configuration,
    // which would make the tests more fragile.
    process.env.THROTTLE_TIME = "100";
    process.env.THROTTLE_LIMIT = defaultThrottleLimit.toString();
    process.env.AEST_THROTTLE_LIMIT = aestThrottleLimit.toString();
    await KeycloakConfig.load();
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      controllers: [AuthTestController, AESTAuthTestController],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe("Throttler Guard", () => {
    it("Should allow requests within the rate limit.", async () => {
      const endpoint = "/auth-test/throttle-test/success";

      // Act and Assert - Make requests up to the limit, all should pass
      for (let i = 0; i < defaultThrottleLimit - 1; i++) {
        await request(app.getHttpServer())
          .get(endpoint)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    });

    it("Should allow requests exceeding the rate limit when a controller is decorated with @SkipThrottle.", async () => {
      const endpoint = "/health/timeout/1500";

      // Act and Assert - Make requests that exceeds the limit, all should pass
      for (let i = 0; i < defaultThrottleLimit + 1; i++) {
        await request(app.getHttpServer()).get(endpoint).expect(HttpStatus.OK);
      }
    });

    it("Should block requests exceeding the default throttler limit (429 Too Many Requests).", async () => {
      // Arrange
      const endpoint = "/auth-test/throttle-test/failure";

      // Act - Exhaust the rate limit (it may have already been exhausted by previous tests)
      for (let i = 0; i < defaultThrottleLimit; i++) {
        await request(app.getHttpServer()).get(endpoint);
      }

      // Assert - Next request should be throttled
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(response.body).toStrictEqual({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: "ThrottlerException: Too Many Requests",
      });
    });

    it("Should block requests exceeding the AEST throttler limit (429 Too Many Requests).", async () => {
      // Arrange
      const endpoint = "/aest/auth-test/throttle-test/failure";

      // Act - Exhaust the AEST rate limit.
      for (let i = 0; i < aestThrottleLimit; i++) {
        await request(app.getHttpServer()).get(endpoint);
      }

      // Assert - Next request should be throttled by AEST-specific settings.
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .expect(HttpStatus.TOO_MANY_REQUESTS);

      expect(response.body).toStrictEqual({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: "ThrottlerException: Too Many Requests",
      });
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
