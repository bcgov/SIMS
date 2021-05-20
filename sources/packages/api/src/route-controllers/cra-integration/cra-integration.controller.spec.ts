import { Test, TestingModule } from "@nestjs/testing";
import { CRAIntegrationController } from "./cra-integration.controller";

describe("CRAIntegrationController", () => {
  let controller: CRAIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CRAIntegrationController],
    }).compile();

    controller = module.get<CRAIntegrationController>(CRAIntegrationController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
