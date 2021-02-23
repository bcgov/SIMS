import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "../../database/database.module";
import { UserService } from "../../services";
import { UserController } from "./user.controller";

describe("UserController", () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [UserService],
      controllers: [UserController],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
