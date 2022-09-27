require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "../../database/database.module";
import { BCeIDService } from "../bceid/bceid.service";
import { ConfigService } from "../config/config.service";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UserService, BCeIDService, ConfigService],
    }).compile();

    await module.init();
    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
