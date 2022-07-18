require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ProgramYearService } from "../../services";
import { ProgramYearController } from "./program-year.controller";
import { DatabaseModule } from "../../database/database.module";
import { DatabaseService } from "../../database/database.service";

describe("ProgramYearController", () => {
  let controller: ProgramYearController;
  let dbService: DatabaseService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ProgramYearService],
      controllers: [ProgramYearController],
    }).compile();
    await module.init();

    controller = module.get<ProgramYearController>(ProgramYearController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.dataSource.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
