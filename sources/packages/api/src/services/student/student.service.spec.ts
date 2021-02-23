import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service";
import { DatabaseModule } from "../../database/database.module";

describe("StudentService", () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [StudentService],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
