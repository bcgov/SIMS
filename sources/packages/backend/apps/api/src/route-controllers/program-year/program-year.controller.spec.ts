require("../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ProgramYearService } from "../../services";
import { ProgramYearStudentsController } from "./program-year.students.controller";
import { DatabaseModule } from "@sims/sims-db";

describe("ProgramYearController", () => {
  let controller: ProgramYearStudentsController;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ProgramYearService],
      controllers: [ProgramYearStudentsController],
    }).compile();
    await module.init();

    controller = module.get<ProgramYearStudentsController>(
      ProgramYearStudentsController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
