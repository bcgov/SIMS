require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseService } from "../../database/database.service";
import { DatabaseModule } from "../../database/database.module";
import { InstitutionLocationService } from "./institution-location.service";

describe("InstitutionLocationService", () => {
  let service: InstitutionLocationService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionLocationService],
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
