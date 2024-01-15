import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  FakeStudentUsersTypes,
  createTestingAppModule,
  getStudentByFakeStudentUserType,
  getStudentToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { Student } from "@sims/sims-db";
import { saveFakeSFASIndividual } from "@sims/test-utils/factories/sfas-individuals";

describe("StudentScholasticStandingsStudentsController(e2e)-getScholasticStandingSummary.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should get the scholastic standing summary for the provided student including the data retrieved from the sfas system when a student user requests it.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      student,
    });
    const scholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application },
      {
        initialValues: { unsuccessfulWeeks: 5 },
      },
    );
    const sinValidation = await db.sinValidation.findOne({
      select: { id: true, sin: true },
      where: { student: { id: student.id } },
    });
    await db.studentScholasticStanding.save(scholasticStanding);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: sinValidation.sin,
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
