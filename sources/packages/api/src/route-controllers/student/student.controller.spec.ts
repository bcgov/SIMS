require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  ArchiveDbService,
  StudentService,
  UserService,
  ATBCService,
  ConfigService,
  StudentFileService,
} from "../../services";
import { StudentController } from "./student.controller";
import { DatabaseModule } from "../../database/database.module";
import { DatabaseService } from "../../database/database.service";

describe("StudentController", () => {
  let controller: StudentController;
  let dbService: DatabaseService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        ConfigService,
        StudentService,
        UserService,
        ArchiveDbService,
        ATBCService,
        StudentFileService,
      ],
      controllers: [StudentController],
    }).compile();
    await module.init();

    controller = module.get<StudentController>(StudentController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
