require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  ApplicationService,
  ArchiveDbService,
  ConfigService,
  KeycloakService,
  MSFAANumberService,
  SequenceControlService,
  SshService,
  StudentFileService,
  StudentService,
  TokensService,
  WorkflowActionsService,
  WorkflowService,
} from "../../services";
import { DatabaseModule } from "../../database/database.module";
import { CRAIntegrationController } from "./cra-integration.system.controller";
import { createMockedJwtService } from "../../testHelpers/mocked-providers/jwt-service-mock";
import { CraIntegrationModule } from "../../cra-integration/cra-integration.module";
import { JwtStrategy } from "../../auth/jwt.strategy";

describe("CRAIntegrationController", () => {
  let controller: CRAIntegrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, CraIntegrationModule],
      providers: [
        SshService,
        SequenceControlService,
        StudentService,
        ArchiveDbService,
        ConfigService,
        ApplicationService,
        StudentFileService,
        WorkflowService,
        WorkflowActionsService,
        MSFAANumberService,
        TokensService,
        KeycloakService,
        createMockedJwtService(),
      ],
      controllers: [CRAIntegrationController],
    })
      .overrideProvider(JwtStrategy)
      .useValue({})
      .compile();

    controller = module.get<CRAIntegrationController>(CRAIntegrationController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
