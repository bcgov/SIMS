require("../../../env_setup");
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import {
  ConfigService,
  WorkflowService,
  TokensService,
  KeycloakService,
} from "..";

describe("WorkflowService", () => {
  let service: WorkflowService;
  let jwtService = new JwtService({
    secretOrPrivateKey: "Secret key",
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        ConfigService,
        TokensService,
        KeycloakService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
