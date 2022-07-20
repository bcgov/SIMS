require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service";
import { DatabaseModule } from "../../database/database.module";
import { SFASIndividualService, SINValidationService } from "..";

describe("StudentService", () => {
  let service: StudentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [StudentService, SFASIndividualService, SINValidationService],
    }).compile();
    await module.init();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
