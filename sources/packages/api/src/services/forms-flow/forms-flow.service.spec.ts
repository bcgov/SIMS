require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { AuthModule } from "../../auth/auth.module";
import { ConfigService, KeycloakService, TokensService } from "..";
import { FormsFlowService } from "./forms-flow.service";
import { DatabaseModule } from "../../database/database.module";
import { JwtService } from "@nestjs/jwt";

describe("FormsFlowService", () => {
  let service: FormsFlowService;
  let jwtService = new JwtService({
    secretOrPrivateKey: "Secret key",
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormsFlowService,
        ConfigService,
        KeycloakService,
        TokensService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<FormsFlowService>(FormsFlowService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
