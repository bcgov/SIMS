require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { DatabaseModule } from "../../database/database.module";
import { InstitutionLocationService } from "./institution-location.service";
import { InstitutionService } from "../institution/institution.service";
import { BCeIDService } from "../bceid/bceid.service";
import { UserService } from "../user/user.service";
import { ConfigService } from "../config/config.service";

describe("InstitutionLocationService", () => {
  let service: InstitutionLocationService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        InstitutionLocationService,
        InstitutionService,
        BCeIDService,
        UserService,
        ConfigService,
      ],
    }).compile();
    await module.init();
    dbService = module.get<DatabaseService>(DatabaseService);
    service = module.get<InstitutionLocationService>(
      InstitutionLocationService,
    );
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
