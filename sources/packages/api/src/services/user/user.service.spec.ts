require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { DatabaseModule } from "../../database/database.module";
import { BCeIDService } from "../bceid/bceid.service";
import { ConfigService } from "../config/config.service";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UserService, BCeIDService, ConfigService],
    }).compile();

    await module.init();
    service = module.get<UserService>(UserService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.dataSource.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
