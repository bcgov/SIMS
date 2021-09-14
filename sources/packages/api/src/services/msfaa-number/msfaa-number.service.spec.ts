require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import { SequenceControlService } from "../../services/sequence-control/sequence-control.service";
import { MSFAANumberService } from "../../services/msfaa-number/msfaa-number.service";
import { DatabaseModule } from "../../database/database.module";
import { DatabaseService } from "../../database/database.service";
import * as dayjs from "dayjs";
import { MAX_MFSAA_VALID_DAYS } from "../../utilities";

describe("MSFAANumberService", () => {
  let service: MSFAANumberService;
  let dbService: DatabaseService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [MSFAANumberService, SequenceControlService],
    }).compile();

    service = module.get<MSFAANumberService>(MSFAANumberService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  afterAll(async () => {
    await dbService.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("isMSFAANumberValid", () => {
    it("should return true when start date is still valid", () => {
      // Arrange
      const validPeriod = MAX_MFSAA_VALID_DAYS - 1;
      const startDate = new Date();
      const endDate = dayjs(startDate).add(validPeriod, "days").toDate();
      // Act
      const result = service.isMSFAANumberValid(startDate, endDate);
      // Assert
      expect(result).toBe(true);
    });

    it("should return false when start date is no longer valid", () => {
      // Arrange
      const startDate = new Date();
      const endDate = dayjs(startDate)
        .add(MAX_MFSAA_VALID_DAYS, "days")
        .toDate();
      // Act
      const result = service.isMSFAANumberValid(startDate, endDate);
      // Assert
      expect(result).toBe(false);
    });

    it("should return false when start date is null", () => {
      // Arrange
      const startDate = null;
      const validPeriod = MAX_MFSAA_VALID_DAYS - 1;
      const endDate = dayjs(new Date()).add(validPeriod, "days").toDate();
      // Act
      const result = service.isMSFAANumberValid(startDate, endDate);
      // Assert
      expect(result).toBe(false);
    });
  });
});
