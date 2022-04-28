require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  StudentService,
  UserService,
  ATBCService,
  ConfigService,
  StudentFileService,
  ApplicationService,
  SequenceControlService,
  WorkflowActionsService,
  WorkflowService,
  KeycloakService,
  TokensService,
  MSFAANumberService,
  EducationProgramService,
  StudentRestrictionService,
  FormService,
  SFASIndividualService,
  SINValidationService,
  SFASApplicationService,
  SFASPartTimeApplicationsService,
  GCNotifyService,
  GCNotifyActionsService,
} from "../../services";
import { StudentController } from "./student.controller";
import { DatabaseModule } from "../../database/database.module";
import { DatabaseService } from "../../database/database.service";
import { createMockedJwtService } from "../../testHelpers/mocked-providers/jwt-service-mock";

describe("StudentController", () => {
  let controller: StudentController;
  let dbService: DatabaseService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        ConfigService,
        StudentService,
        UserService,
        ATBCService,
        SequenceControlService,
        StudentFileService,
        ApplicationService,
        WorkflowActionsService,
        WorkflowService,
        KeycloakService,
        ConfigService,
        TokensService,
        MSFAANumberService,
        EducationProgramService,
        FormService,
        createMockedJwtService(),
        StudentRestrictionService,
        SFASIndividualService,
        SINValidationService,
        SFASApplicationService,
        SFASPartTimeApplicationsService,
        GCNotifyService,
        GCNotifyActionsService,
      ],
      controllers: [StudentController],
    }).compile();
    await module.init();

    controller = module.get<StudentController>(StudentController);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
