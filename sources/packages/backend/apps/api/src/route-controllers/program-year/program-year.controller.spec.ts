require("../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ProgramYearService } from "../../services";
import { ProgramYearController } from "./program-year.controller";

describe("ProgramYearController", () => {
  let controller: ProgramYearController;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProgramYearService],
      controllers: [ProgramYearController],
    }).compile();
    await module.init();

    controller = module.get<ProgramYearController>(ProgramYearController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
