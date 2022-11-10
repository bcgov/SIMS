import { Test, TestingModule } from "@nestjs/testing";
import { SeedExecutor } from "./seed-executor";
import { DiscoveryService } from "@golevelup/nestjs-discovery";
import { MetadataScanner } from "@nestjs/core";

describe("SeedExecuter", () => {
  let service: SeedExecutor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SeedExecutor, DiscoveryService, MetadataScanner],
    }).compile();

    service = module.get<SeedExecutor>(SeedExecutor);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
