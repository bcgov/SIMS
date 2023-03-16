import { HttpStatus, INestApplication } from "@nestjs/common";
import { ProgramYear } from "@sims/sims-db";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  FakeStudentUsersTypes,
} from "../../../../testHelpers";

describe("ProgramYearStudentsController(e2e)-getProgramYears", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let programYear2000: ProgramYear;
  let programYear2024: ProgramYear;
  let programYear2025: ProgramYear;
  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    appDataSource = dataSource;
    const programYearRepo = appDataSource.getRepository(ProgramYear);

    programYear2000 = {
      programYear: "2000-2001",
      programYearDesc:
        "Study starting between August 01, 2000 and July 31, 2001",
      formName: "SFAA2000-01",
      active: false,
      parentFormName: "SFAA2000-01-parent",
      partnerFormName: "SFAA2000-01-partner",
      programYearPrefix: "2000",
    } as ProgramYear;

    programYear2024 = {
      programYear: "2024-2025",
      programYearDesc:
        "Study starting between August 01, 2024 and July 31, 2025",
      formName: "SFAA2024-25",
      active: true,
      parentFormName: "SFAA2024-01-parent",
      partnerFormName: "SFAA2024-01-partner",
      programYearPrefix: "2024",
    } as ProgramYear;

    programYear2025 = {
      programYear: "2025-2026",
      programYearDesc:
        "Study starting between August 01, 2025 and July 31, 2026",
      formName: "SFAA2025-26",
      active: true,
      parentFormName: "SFAA2025-01-parent",
      partnerFormName: "SFAA2025-01-partner",
      programYearPrefix: "2025",
    } as ProgramYear;

    const programYear2000Promise = programYearRepo.save(programYear2000);
    const programYear2024Promise = programYearRepo.save(programYear2024);
    const programYear2025Promise = programYearRepo.save(programYear2025);

    [programYear2000, programYear2024, programYear2025] = await Promise.all([
      programYear2000Promise,
      programYear2024Promise,
      programYear2025Promise,
    ]);

    app = nestApplication;
  });

  it("Should get the list of the available program years when available.", async () => {
    // Arrange
    const endpoint = "/students/program-year/options-list";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const programYearList = response.body;
        expect(programYearList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: programYear2024.id,
              description:
                "(2024-2025) - Study starting between August 01, 2024 and July 31, 2025",
            }),
            expect.objectContaining({
              id: programYear2025.id,
              description:
                "(2025-2026) - Study starting between August 01, 2025 and July 31, 2026",
            }),
          ]),
        );
        expect(programYearList).not.toContainEqual(
          expect.objectContaining({
            id: programYear2000.id,
            description:
              "(2000-2001) - Study starting between August 01, 2000 and July 31, 2001",
          }),
        );
      });
  });

  afterAll(async () => {
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    await programYearRepo.remove(programYear2000);
    await programYearRepo.remove(programYear2024);
    await programYearRepo.remove(programYear2025);
    app?.close();
  });
});
