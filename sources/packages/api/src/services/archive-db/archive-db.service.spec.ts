import "reflect-metadata";
require("../../../env_setup");
import { Test, TestingModule } from "@nestjs/testing";
import * as dayjs from "dayjs";
import { StudentLegacyData } from "../../types";
import { ArchiveDbService } from "./archive-db.service";

type Individual = { sin: string; dob: string; pd: "Y" | null };

const testData: Array<Individual> = [
  {
    sin: "500016209",
    dob: "2001-02-23 00:00:00",
    pd: "Y",
  },
  {
    sin: "286206651",
    dob: "1998-08-15 00:00:00",
    pd: null,
  },
];

const createIndividuals = async (service: ArchiveDbService) => {
  for (const item of testData) {
    const sin = `${item.sin}.000000000`;
    await service.connection.query(
      "INSERT INTO individual(sin,permanent_disability_flg,date_of_birth) VALUES ($1,$2,$3)",
      [sin, item.pd, item.dob],
    );
  }
};

const removeIndividuals = async (service: ArchiveDbService) => {
  for (const item of testData) {
    await service.connection.query(
      `DELETE FROM individual where sin=${item.sin}`,
    );
  }
};

describe("ArchiveDbService", () => {
  let service: ArchiveDbService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArchiveDbService],
    }).compile();

    service = module.get<ArchiveDbService>(ArchiveDbService);
    await service.init();
    await createIndividuals(service);
  });

  afterEach(async () => {
    await removeIndividuals(service);
    await service.connection.close();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should init", async () => {
    expect(service.connection).toBeDefined();
  });

  it("should get status with permanentDisabilityFlag = Y", async () => {
    const r: StudentLegacyData[] = await service.getIndividualPDStatus({
      birthdate: dayjs(testData[0].dob).toDate(),
      sin: testData[0].sin,
    });
    expect(r).toBeDefined();
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].disability).toBeDefined();
    expect(r[0].disability).toEqual("Y");
  });

  it("should get status with permanentDisabilityFlag = null", async () => {
    const r: StudentLegacyData[] = await service.getIndividualPDStatus({
      birthdate: dayjs(testData[1].dob).toDate(),
      sin: testData[1].sin,
    });
    expect(r).toBeDefined();
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].disability).toBeDefined();
    expect(r[0].disability).toEqual(null);
  });
});
