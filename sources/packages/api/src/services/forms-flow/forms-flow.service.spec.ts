require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService, KeycloakService } from "..";
import { FormsFlowService } from "./forms-flow.service";

describe("FormsFlowService", () => {
  let service: FormsFlowService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormsFlowService, ConfigService, KeycloakService],
    }).compile();

    service = module.get<FormsFlowService>(FormsFlowService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
