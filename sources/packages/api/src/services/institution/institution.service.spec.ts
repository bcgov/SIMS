require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { InstitutionService } from "./institution.service";
import { DatabaseModule } from "../../database/database.module";
import { BCeIDService } from "../bceid/bceid.service";
import { ConfigService } from "../config/config.service";
import { UserService } from "../user/user.service";

describe("InstitutionService", () => {
  let service: InstitutionService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionService, BCeIDService, ConfigService, UserService],
    }).compile();
    await module.init();

    service = module.get<InstitutionService>(InstitutionService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
