import { Test, TestingModule } from "@nestjs/testing";
import { InstitutionService, UserService } from "../../services";
import { InstitutionController } from "./institution.controller";
import { DatabaseModule } from "../../database/database.module";

describe("InstitutionController", () => {
  let controller: InstitutionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [InstitutionService, UserService],
      controllers: [InstitutionController],
    }).compile();

    controller = module.get<InstitutionController>(InstitutionController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
