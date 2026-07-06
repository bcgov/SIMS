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
  InstitutionAuthTestController,
  StudentAuthTestController,
} from "../../../testHelpers/controllers/auth-test/auth-test.controller";

describe("Guards and Decorators - Throttler (e2e)", () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  const defaultThrottleLimit = 10;
  const aestThrottleLimit = 4;
  const institutionThrottleLimit = 3;
  // Restrictive fallback applied to client-specific routes (e.g. students) when
  // no client-specific throttler environment variables are provided.
  const restrictiveFallbackLimit = Math.floor(defaultThrottleLimit / 2);

  beforeAll(async () => {
    // Keep the throttler environment variables low for testing purposes
    // avoiding consuming its values from the global configuration,
    // which would make the tests more fragile.
    // The institution limit is set to validate a configured client policy while
    // the student routes are intentionally left unset to validate the
    // restrictive fallback applied when no client-specific values are provided.
    process.env.THROTTLE_TIME = "100";
    process.env.THROTTLE_LIMIT = defaultThrottleLimit.toString();
    process.env.AEST_THROTTLE_LIMIT = aestThrottleLimit.toString();
    process.env.INSTITUTIONS_THROTTLE_LIMIT = institutionThrottleLimit.toString();
    delete process.env.STUDENTS_THROTTLE_TIME;
    delete process.env.STUDENTS_THROTTLE_LIMIT;
    await KeycloakConfig.load();
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, createZeebeModuleMock(), DiscoveryModule],
      controllers: [
        AuthTestController,
        AESTAuthTestController,
        InstitutionAuthTestController,
        StudentAuthTestController,
      ],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("Should allow requests when the request count is within the rate limit.", async () => {
    const endpoint = "/auth-test/throttle-test/success";

    // Act and Assert - Make requests up to the limit, all should pass
    for (let i = 0; i < defaultThrottleLimit - 1; i++) {
      await request(app.getHttpServer())
        .get(endpoint)
        .expect(HttpStatus.UNAUTHORIZED);
    }
  });

  it("Should allow requests exceeding the rate limit when the controller is decorated with @SkipThrottle.", async () => {
    const endpoint = "/health/timeout/1500";

    // Act and Assert - Make requests that exceeds the limit, all should pass
    for (let i = 0; i < defaultThrottleLimit + 1; i++) {
      await request(app.getHttpServer()).get(endpoint).expect(HttpStatus.OK);
    }
  });

  it("Should block requests with a 429 Too Many Requests error when the default throttler limit is exceeded.", async () => {
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

  it("Should block requests with a 429 Too Many Requests error when the AEST throttler limit is exceeded.", async () => {
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

  it("Should block requests with a 429 Too Many Requests error when the configured institution throttler limit is exceeded.", async () => {
    // Arrange
    const endpoint = "/institutions/auth-test/throttle-test/failure";

    // Act - Exhaust the configured institution rate limit.
    for (let i = 0; i < institutionThrottleLimit; i++) {
      await request(app.getHttpServer()).get(endpoint);
    }

    // Assert - Next request should be throttled by the configured institution settings.
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.TOO_MANY_REQUESTS);

    expect(response.body).toStrictEqual({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: "ThrottlerException: Too Many Requests",
    });
  });

  it("Should block requests with a 429 Too Many Requests error when the restrictive fallback limit is exceeded for a client without throttler environment variables.", async () => {
    // Arrange - Student routes have no client-specific throttler variables, so
    // they fall back to the restrictive limit (half of the default limit).
    const endpoint = "/students/auth-test/throttle-test/failure";

    // Act - Exhaust the restrictive fallback rate limit.
    for (let i = 0; i < restrictiveFallbackLimit; i++) {
      await request(app.getHttpServer()).get(endpoint);
    }

    // Assert - Next request should be throttled by the restrictive fallback settings.
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.TOO_MANY_REQUESTS);

    expect(response.body).toStrictEqual({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: "ThrottlerException: Too Many Requests",
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
