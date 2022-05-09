require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  BCeIDService,
  InstitutionService,
  UserService,
  ConfigService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
  FormService,
} from "../../services";
import { InstitutionInstitutionsController } from "./institution.institutions.controller";
import { DatabaseModule } from "../../database/database.module";
import {
  InstitutionLocationControllerService,
  InstitutionControllerService,
} from "../../route-controllers";

describe("InstitutionController", () => {
  let controller: InstitutionInstitutionsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        InstitutionService,
        UserService,
        BCeIDService,
        ConfigService,
        InstitutionLocationService,
        DesignationAgreementLocationService,
        InstitutionLocationControllerService,
        InstitutionControllerService,
        FormService,
      ],
      controllers: [InstitutionInstitutionsController],
    }).compile();
    await module.init();
    controller = module.get<InstitutionInstitutionsController>(
      InstitutionInstitutionsController,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
