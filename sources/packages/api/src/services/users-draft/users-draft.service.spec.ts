require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "../../database/database.module";
import { DatabaseService } from "../../database/database.service";
import { UsersDraftService } from "./users-draft.service";

describe("UsersDraftService", () => {
  let service: UsersDraftService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UsersDraftService],
    }).compile();
    await module.init();

    service = module.get<UsersDraftService>(UsersDraftService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
