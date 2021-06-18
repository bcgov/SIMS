require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "../config/config.service";
import { ServiceAccountService } from "../service-account/service-account.service";
import { WorkflowService } from "./workflow.service";

describe("WorkflowService", () => {
  let service: WorkflowService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkflowService, ConfigService, ServiceAccountService],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
