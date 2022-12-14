require("../../../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "@sims/sims-db";
import { ConfigModule } from "@sims/utilities/config";
import { BCeIDService } from "../bceid/bceid.service";
import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule, ConfigModule],
      providers: [UserService, BCeIDService],
    }).compile();

    await module.init();
    service = module.get<UserService>(UserService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
