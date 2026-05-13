import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createTestingAppModule } from "../../../../testHelpers";

describe("MetricsController(e2e)-getMetrics", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const { nestApplication } = await createTestingAppModule();
    app = nestApplication;
  });

  it("Should return Prometheus metrics in text format when the endpoint is called without authentication.", async () => {
    // Arrange
    const endpoint = "/metrics";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .expect(HttpStatus.OK)
      .expect((res) => {
        expect(res.headers["content-type"]).toContain("text/plain");
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
