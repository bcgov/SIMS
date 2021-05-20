require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  ArchiveDbService,
  ConfigService,
  CRAIntegrationService,
  CRAPersonalVerificationService,
  SshService,
  StudentService,
} from "../../services";
import { DatabaseModule } from "../../database/database.module";
import { CRAIntegrationController } from "./cra-integration.controller";

describe("CRAIntegrationController", () => {
  let controller: CRAIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        SshService,
        CRAIntegrationService,
        CRAPersonalVerificationService,
        StudentService,
        ArchiveDbService,
        ConfigService,
      ],
      controllers: [CRAIntegrationController],
    }).compile();

    controller = module.get<CRAIntegrationController>(CRAIntegrationController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
