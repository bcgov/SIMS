import { Test, TestingModule } from "@nestjs/testing";
import { DesignationAgreementPendingService } from "./designation-agreement-pending.service";

describe("DesignationAgreementPendingService", () => {
  let service: DesignationAgreementPendingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DesignationAgreementPendingService],
    }).compile();

    service = module.get<DesignationAgreementPendingService>(
      DesignationAgreementPendingService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
