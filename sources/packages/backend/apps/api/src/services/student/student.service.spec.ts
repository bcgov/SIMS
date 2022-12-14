require("../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service";
import { SFASIndividualService, SINValidationService } from "..";

describe("StudentService", () => {
  let service: StudentService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StudentService, SFASIndividualService, SINValidationService],
    }).compile();
    await module.init();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
