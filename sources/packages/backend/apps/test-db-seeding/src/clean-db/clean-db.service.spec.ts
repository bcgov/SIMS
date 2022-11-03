import { Test, TestingModule } from "@nestjs/testing";
import { CleanDbService } from "./clean-db.service";

describe("CleanDbService", () => {
  let service: CleanDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleanDbService],
    }).compile();

    service = module.get<CleanDbService>(CleanDbService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
