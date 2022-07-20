import "reflect-metadata";
require("../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { DatabaseModule } from "./database.module";
import { DatabaseService } from "./database.service";

describe("Database Service", () => {
  let service: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();
    await module.init();
    service = module.get<DatabaseService>(DatabaseService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should create service", async () => {
    const svc = new DatabaseService();
    expect(svc).toBeDefined();
  });
});
