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

describe("ProgramYearStudentsController(e2e)-getProgramYearById", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let programYear2001: ProgramYear;
  let programYear2026: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    appDataSource = dataSource;
    const programYearRepo = appDataSource.getRepository(ProgramYear);

    programYear2001 = {
      programYear: "2001-2002",
      programYearDesc:
        "Study starting between August 01, 2001 and July 31, 2002",
      formName: "SFAA2001-02",
      active: false,
      parentFormName: "SFAA2001-01-parent",
      partnerFormName: "SFAA2001-01-partner",
      programYearPrefix: "2001",
    } as ProgramYear;

    programYear2026 = {
      programYear: "2026-2027",
      programYearDesc:
        "Study starting between August 01, 2026 and July 31, 2027",
      formName: "SFAA2026-27",
      active: true,
      parentFormName: "SFAA2026-01-parent",
      partnerFormName: "SFAA2026-01-partner",
      programYearPrefix: "2026",
    } as ProgramYear;

    const programYear2001Promise = programYearRepo.save(programYear2001);
    const programYear2026Promise = programYearRepo.save(programYear2026);

    [programYear2001, programYear2026] = await Promise.all([
      programYear2001Promise,
      programYear2026Promise,
    ]);

    app = nestApplication;
  });

  it("Should get an active program year by id when available.", async () => {
    // Arrange
    const endpoint = `/students/program-year/${programYear2026.id}/active`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: programYear2026.id,
        formName: programYear2026.formName,
        programYear: programYear2026.programYear,
        programYearDesc: programYear2026.programYearDesc,
      });
  });

  it("Should return 'not found' status when a program year does not exist.", async () => {
    // Arrange
    const endpoint = "/students/program-year/9999/active";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Program Year Id 9999 was not found.",
        error: "Not Found",
      });
  });

  it("Should return 'not found' status when a program year is inactive.", async () => {
    // Arrange
    const endpoint = `/students/program-year/${programYear2001.id}/active`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: `Program Year Id ${programYear2001.id} was not found.`,
        error: "Not Found",
      });
  });

  afterAll(async () => {
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    await programYearRepo.remove(programYear2001);
    await programYearRepo.remove(programYear2026);
    app?.close();
  });
});
