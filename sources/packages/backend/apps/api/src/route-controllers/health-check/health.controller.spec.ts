import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { DatabaseModule } from "@sims/sims-db";

// TODO: must mock DB dependencies.
describe.skip("HealthController", () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      controllers: [HealthController],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe("root", () => {
    it("should return Hello world string with db connection status and version", () => {
      const expected = `Hello World! The database dataSource is true and version: ${
        process.env.VERSION ?? "-1"
      }`;
      expect(healthController.getHello()).toBe(expected);
    });
  });
});
