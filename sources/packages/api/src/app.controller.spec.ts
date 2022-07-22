require("../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { DatabaseModule } from "./database/database.module";

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it("should return Hello world string with db connection status and version", () => {
      const expected = `Hello World! The database dataSource is true and version: ${
        process.env.VERSION ?? "-1"
      }`;
      expect(appController.getHello()).toBe(expected);
    });
  });
});
