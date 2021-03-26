import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "../config/config.service";
import { ServiceAccountService } from "./service-account.service";

describe("ServiceAccountService", () => {
  let service: ServiceAccountService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceAccountService, ConfigService],
    }).compile();

    service = module.get<ServiceAccountService>(ServiceAccountService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
