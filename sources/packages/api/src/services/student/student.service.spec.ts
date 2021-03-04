require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service";
import { DatabaseModule } from "../../database/database.module";
import { ArchiveDbService } from "../archive-db/archive-db.service";

describe("StudentService", () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [StudentService, ArchiveDbService],
    }).compile();
    await module.init();

    service = module.get<StudentService>(StudentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.logger()).toBeDefined();
  });
});
