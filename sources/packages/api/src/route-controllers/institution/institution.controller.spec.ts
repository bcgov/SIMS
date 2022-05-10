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

import { DatabaseModule } from "../../database/database.module";
import {
  InstitutionLocationControllerService,
  InstitutionControllerService,
} from "../../route-controllers";

describe("InstitutionController", () => {
  let controller: InstitutionControllerService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [
        InstitutionService,
        UserService,
        BCeIDService,
        ConfigService,
        FormService,
        InstitutionLocationService,
        DesignationAgreementLocationService,
        InstitutionLocationControllerService,
        InstitutionControllerService,
      ],
      controllers: [InstitutionControllerService],
    }).compile();
    await module.init();
    controller = module.get<InstitutionControllerService>(
      InstitutionControllerService,
    );
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
