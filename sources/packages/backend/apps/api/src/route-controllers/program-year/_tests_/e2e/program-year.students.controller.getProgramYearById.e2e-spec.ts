import { HttpStatus, INestApplication } from "@nestjs/common";
import { ProgramYear } from "@sims/sims-db";
import { createFakeProgramYear } from "@sims/test-utils";
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
  let programYear2002: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    appDataSource = dataSource;
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    programYear2001 = createFakeProgramYear(2001);
    programYear2001.active = false;
    programYear2002 = createFakeProgramYear(2002);
    const programYear2001Promise = programYearRepo.save(programYear2001);
    const programYear2002Promise = programYearRepo.save(programYear2002);
    [programYear2001, programYear2002] = await Promise.all([
      programYear2001Promise,
      programYear2002Promise,
    ]);
    app = nestApplication;
  });

  it("Should get an active program year by id when available.", async () => {
    // Arrange
    const endpoint = `/students/program-year/${programYear2002.id}/active`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // TODO: Update this test when we have a program year form name.
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: programYear2002.id,
        formName: "programYear2002.formName",
        programYear: programYear2002.programYear,
        programYearDesc: programYear2002.programYearDesc,
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
    app?.close();
  });
});
