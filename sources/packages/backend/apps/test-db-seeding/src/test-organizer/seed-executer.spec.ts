import { Test, TestingModule } from "@nestjs/testing";
import { SeedExecuter } from "./seed-executer";
import { DiscoveryService } from "@golevelup/nestjs-discovery";

describe("SeedExecuter", () => {
  let service: SeedExecuter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeedExecuter, DiscoveryService],
    }).compile();

    service = module.get<SeedExecuter>(SeedExecuter);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
