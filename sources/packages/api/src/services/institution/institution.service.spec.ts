require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { InstitutionService } from "./institution.service";
import { DatabaseModule } from "../../database/database.module";
import { ArchiveDbService } from "../archive-db/archive-db.service";

describe("InstitutionService", () => {
  let service: InstitutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionService, ArchiveDbService],
    }).compile();
    await module.init();

    service = module.get<InstitutionService>(InstitutionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
    expect(service.logger()).toBeDefined();
  });
});
