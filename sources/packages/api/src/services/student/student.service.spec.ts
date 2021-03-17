require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { StudentService } from "./student.service";
import { DatabaseModule } from "../../database/database.module";
import { ArchiveDbService } from "../archive-db/archive-db.service";
import { DatabaseService } from "../../database/database.service";

describe("StudentService", () => {
  let service: StudentService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [StudentService, ArchiveDbService],
    }).compile();
    await module.init();

    service = module.get<StudentService>(StudentService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
