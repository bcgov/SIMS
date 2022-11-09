import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DatabaseModule } from "@sims/sims-db";
import { DataSource } from "typeorm";
import { CleanDb } from "./clean-db";

jest.setTimeout(15000);

describe("CleanDb", () => {
  let service: CleanDb;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CleanDb],
      imports: [DatabaseModule],
    }).compile();

    service = module.get<CleanDb>(CleanDb);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
