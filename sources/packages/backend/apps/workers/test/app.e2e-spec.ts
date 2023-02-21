import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { WorkersModule } from "./../src/workers.module";

describe("WorkersController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [WorkersModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("Should be able to initialize workers module", () => {
    expect(app).toBeDefined();
  });
});
