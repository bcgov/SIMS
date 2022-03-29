require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  BCeIDService,
  InstitutionService,
  UserService,
  ConfigService,
  InstitutionLocationService,
  DesignationAgreementLocationService,
} from "../../services";
import { InstitutionController } from "./institution.controller";
import { DatabaseModule } from "../../database/database.module";
import { InstitutionLocationsControllerService } from "../institution-locations/institution-locations.controller.service";

describe("InstitutionController", () => {
  let controller: InstitutionController;

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
        InstitutionLocationsControllerService,
      ],
      controllers: [InstitutionController],
    }).compile();
    await module.init();
    controller = module.get<InstitutionController>(InstitutionController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
