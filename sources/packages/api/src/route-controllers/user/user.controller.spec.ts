require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { DatabaseModule } from "../../database/database.module";
import {
  BCeIDService,
  ConfigService,
  UserService,
  InstitutionService,
  InstitutionLocationService,
} from "../../services";
import { UserController } from "./user.controller";

describe("UserController", () => {
  let controller: UserController;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        UserService,
        BCeIDService,
        ConfigService,
        InstitutionService,
        InstitutionLocationService,
      ],
      controllers: [UserController],
    }).compile();

    await module.init();

    controller = module.get<UserController>(UserController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
