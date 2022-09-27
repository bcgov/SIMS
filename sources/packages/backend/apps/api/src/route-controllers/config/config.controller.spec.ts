require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "../../services/config/config.service";
import { ConfigController } from "./config.controller";

describe("ConfigController", () => {
  let controller: ConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
      controllers: [ConfigController],
    }).compile();
    await module.init();
    controller = module.get<ConfigController>(ConfigController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
