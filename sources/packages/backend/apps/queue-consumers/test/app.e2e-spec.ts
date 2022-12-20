require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { QueueConsumersModule } from "../src/queue-consumers.module";

describe("QueueConsumersModule (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [QueueConsumersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("Should be able to initialize queue-consumers module", () => {
    expect(app).toBeDefined();
  });
});
