require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService, SshService } from "..";
import { CraIntegrationService } from "./cra-integration.service";

describe("CraIntegrationService", () => {
  let service: CraIntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CraIntegrationService, ConfigService, SshService],
    }).compile();

    service = await module.resolve<CraIntegrationService>(
      CraIntegrationService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
