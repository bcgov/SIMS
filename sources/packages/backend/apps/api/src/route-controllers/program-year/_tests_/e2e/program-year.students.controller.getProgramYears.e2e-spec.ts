import { HttpStatus, INestApplication } from "@nestjs/common";
import { ProgramYear } from "@sims/sims-db";
import * as request from "supertest";
import { DataSource } from "typeorm";

import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
} from "../../../../testHelpers";
import {
  getStudentToken,
  FakeStudentUsersTypes,
} from "../../../../testHelpers";

describe("ProgramYearStudentsController(e2e)-getProgramYears", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    appDataSource = dataSource;
    app = nestApplication;
  });

  it("Should get the list of the available program years.", async () => {
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
        expect(programYearList).toHaveLength(3);
        expect(programYearList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              description:
                "(2021-2022) - Study starting between August 01, 2021 and July 31, 2022",
            }),
            expect.objectContaining({
              id: 2,
              description:
                "(2022-2023) - Study starting between August 01, 2022 and July 31, 2023",
            }),
            expect.objectContaining({
              id: 3,
              description:
                "(2023-2024) - Study starting between August 01, 2023 and July 31, 2024",
            }),
          ]),
        );
      });
  });

  it("Should not include inactive program years in the list.", async () => {
    // Arrange
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    const programYear = await programYearRepo.findOneBy({ id: 2 });
    programYear.active = false;
    await programYearRepo.save(programYear);
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
        expect(programYearList).toHaveLength(2);
        expect(programYearList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              description:
                "(2021-2022) - Study starting between August 01, 2021 and July 31, 2022",
            }),
            expect.objectContaining({
              id: 3,
              description:
                "(2023-2024) - Study starting between August 01, 2023 and July 31, 2024",
            }),
          ]),
        );
      });

    // Revert
    programYear.active = true;
    await programYearRepo.save(programYear);
  });

  it("Should get the an active program year by id.", async () => {
    // Arrange
    const endpoint = "/students/program-year/1/active";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const programYear = response.body;
        expect(programYear).toEqual({
          id: 1,
          formName: "SFAA2021-22",
          programYear: "2021-2022",
          programYearDesc:
            "Study starting between August 01, 2021 and July 31, 2022",
        });
      });
  });

  it("Should return 'not found' status code for an inexistent program year.", async () => {
    // Arrange
    const endpoint = "/students/program-year/4/active";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });
  it("Should return 'not found' status code for an inactive program year.", async () => {
    // Arrange
    const programYearRepo = appDataSource.getRepository(ProgramYear);
    const programYear = await programYearRepo.findOneBy({ id: 3 });
    programYear.active = false;
    await programYearRepo.save(programYear);
    const endpoint = "/students/program-year/3/active";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);

    // Revert
    programYear.active = true;
    await programYearRepo.save(programYear);
  });
});
