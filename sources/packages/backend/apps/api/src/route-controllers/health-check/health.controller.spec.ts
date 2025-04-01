import { Test, TestingModule } from "@nestjs/testing";
import { HealthController } from "./health.controller";
import { DatabaseModule } from "@sims/sims-db";
import { TerminusModule } from "@nestjs/terminus";

// TODO: must mock DB dependencies.
describe.skip("HealthController", () => {
  let healthController: HealthController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, TerminusModule],
      controllers: [HealthController],
    }).compile();

    healthController = app.get<HealthController>(HealthController);
  });

  describe("root", () => {
    it("should return a health check", () => {
      expect(healthController.check()).toBeCalled();
    });
  });
});
