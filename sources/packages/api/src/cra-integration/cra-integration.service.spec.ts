require("../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService, SshService } from "../services";
import { CRAIntegrationService } from "./cra-integration.service";

describe("CRAIntegrationService", () => {
  let service: CRAIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CRAIntegrationService, ConfigService, SshService],
    }).compile();

    service = await module.resolve<CRAIntegrationService>(
      CRAIntegrationService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
