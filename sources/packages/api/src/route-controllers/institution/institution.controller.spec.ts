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
import { JwtService } from "@nestjs/jwt";
import { DisbursementReceiptRequestService } from "../../esdc-integration/disbursement-receipt-integration/disbursement-receipt-request.service";

describe("InstitutionController", () => {
  let controller: InstitutionInstitutionsController;
  const jwtService = new JwtService({
    secretOrPrivateKey: "Secret key",
  });

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
        DisbursementReceiptRequestService,
        InstitutionLocationControllerService,
        InstitutionControllerService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
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
