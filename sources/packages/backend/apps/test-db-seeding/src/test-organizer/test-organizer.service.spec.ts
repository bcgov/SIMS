import { Test, TestingModule } from "@nestjs/testing";
import { TestOrganizerService } from "./test-organizer.service";

describe("TestOrganizerService", () => {
  let service: TestOrganizerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TestOrganizerService],
    }).compile();

    service = module.get<TestOrganizerService>(TestOrganizerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
