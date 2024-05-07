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

describe("ProgramYearStudentsController(e2e)-getProgramYears", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let programYear2003: ProgramYear;
  let programYear2004: ProgramYear;
  let programYear2005: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    appDataSource = dataSource;
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    programYear2003 = createFakeProgramYear(2003);
    programYear2003.active = false;
    programYear2004 = createFakeProgramYear(2004);
    programYear2005 = createFakeProgramYear(2005);
    const programYear2003Promise = programYearRepo.save(programYear2003);
    const programYear2004Promise = programYearRepo.save(programYear2004);
    const programYear2005Promise = programYearRepo.save(programYear2005);
    [programYear2003, programYear2004, programYear2005] = await Promise.all([
      programYear2003Promise,
      programYear2004Promise,
      programYear2005Promise,
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
              description:
                "(2004-2005) - My first day of classes starts between August 01, 2004 and July 31, 2005",
            }),
            expect.objectContaining({
              description:
                "(2005-2006) - My first day of classes starts between August 01, 2005 and July 31, 2006",
            }),
          ]),
        );
        expect(programYearList).not.toContainEqual(
          expect.objectContaining({
            description:
              "(2003-2004) - My first day of classes starts between August 01, 2003 and July 31, 2004",
          }),
        );
      });
  });

  afterAll(async () => {
    app?.close();
  });
});
