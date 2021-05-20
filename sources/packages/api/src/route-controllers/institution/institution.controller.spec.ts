require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import {
  BCeIDService,
  InstitutionService,
  UserService,
  ConfigService,
  InstitutionLocationService,
} from "../../services";
import { InstitutionController } from "./institution.controller";
import { DatabaseModule } from "../../database/database.module";

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
