import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "../config/config.service";
import { FormService } from "./form.service";

describe("FormService", () => {
  let service: FormService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormService, ConfigService],
    }).compile();
    service = module.get<FormService>(FormService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
