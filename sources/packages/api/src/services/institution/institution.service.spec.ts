require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { InstitutionService } from "./institution.service";
import { DatabaseModule } from "../../database/database.module";
import { BCeIDService } from "../bceid/bceid.service";

describe("InstitutionService", () => {
  let service: InstitutionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionService, BCeIDService],
    }).compile();
    await module.init();

    service = module.get<InstitutionService>(InstitutionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
