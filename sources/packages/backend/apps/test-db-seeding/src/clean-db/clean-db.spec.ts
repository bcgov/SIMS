import { Test, TestingModule } from "@nestjs/testing";
import { CleanDb } from "./clean-db";

describe("CleanDb", () => {
  let service: CleanDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleanDb],
    }).compile();

    service = module.get<CleanDb>(CleanDb);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
