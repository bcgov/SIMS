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
import {
  SINValidation,
  Student,
  StudentScholasticStanding,
} from "@sims/sims-db";
import { saveFakeSFASIndividual } from "@sims/test-utils/factories/sfas-individuals";
import { Repository } from "typeorm";

describe("StudentScholasticStandingsStudentsController(e2e)-getScholasticStandingSummary.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let student: Student;
  let sinValidationRepo: Repository<SINValidation>;
  let scholasticStandingRepo: Repository<StudentScholasticStanding>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sinValidationRepo = db.dataSource.getRepository(SINValidation);
    scholasticStandingRepo = db.dataSource.getRepository(
      StudentScholasticStanding,
    );
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
        initialValue: { numberOfUnsuccessfulWeeks: 5 },
      },
    );
    const sinValidation = await sinValidationRepo.findOne({
      select: { id: true, sin: true },
      where: { student: { id: student.id } },
    });
    await scholasticStandingRepo.save(scholasticStanding);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: sinValidation.sin,
        unsuccessfulCompletion: 12,
      },
    });
    const endpoint = `/students/scholastic-standing/summary`;
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
