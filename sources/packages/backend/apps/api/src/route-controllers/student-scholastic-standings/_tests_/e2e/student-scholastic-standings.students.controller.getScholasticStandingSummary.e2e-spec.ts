import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  FakeStudentUsersTypes,
  createTestingAppModule,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import * as request from "supertest";
import { saveFakeSFASIndividual } from "@sims/test-utils/factories/sfas-individuals";
import { TestingModule } from "@nestjs/testing";

describe("StudentScholasticStandingsStudentsController(e2e)-getScholasticStandingSummary.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  it("Should get the scholastic standing summary for the provided student including the data retrieved from the sfas system when a student user requests it.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    const application = await saveFakeApplication(db.dataSource, {
      student,
    });
    const scholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application },
      {
        initialValues: { unsuccessfulWeeks: 5 },
      },
    );
    await db.studentScholasticStanding.save(scholasticStanding);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: student.sinValidation.sin,
        student,
        unsuccessfulCompletion: 12,
      },
    });
    const endpoint = "/students/scholastic-standing/summary";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ lifetimeUnsuccessfulCompletionWeeks: 17 });
  });
});
