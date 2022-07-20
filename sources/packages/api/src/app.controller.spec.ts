require("../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { simsDataSource } from "./database/data-source";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { closeDB, setupDB } from "./testHelpers";

describe("AppController", () => {
  let appController: AppController;

  beforeAll(async () => {
    await setupDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("root", () => {
    it("should return Hello world string with db connection status and version", () => {
      const expected = `Hello World! The database dataSource is ${
        simsDataSource.isInitialized
      } and version: ${process.env.VERSION ?? "-1"}`;
      expect(appController.getHello()).toBe(expected);
    });
  });
});
