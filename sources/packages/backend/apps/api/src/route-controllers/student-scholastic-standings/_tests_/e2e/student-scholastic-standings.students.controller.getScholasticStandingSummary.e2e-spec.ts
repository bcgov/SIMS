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
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import * as request from "supertest";
import { saveFakeSFASIndividual } from "@sims/test-utils/factories/sfas-individuals";
import { TestingModule } from "@nestjs/testing";
import { OfferingIntensity } from "@sims/sims-db";

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

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
  });

  it("Should get the scholastic standing summary for the provided student including the data retrieved from the sfas system when a student user requests it.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);
    const application = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      {
        initialValues: {
          offeringIntensity: OfferingIntensity.fullTime,
        },
      },
    );
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
      .expect({
        fullTimeLifetimeUnsuccessfulCompletionWeeks: 17,
        partTimeLifetimeUnsuccessfulCompletionWeeks: 0,
      });
  });

  it(
    "Should get scholastic standing summary for a student excluding the details from reversed scholastic standing(s)" +
      " when a student has one ore more reversed scholastic standings.",
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        initialValues: {
          offeringIntensity: OfferingIntensity.fullTime,
        },
      });
      const student = application.student;
      // Create a scholastic standing with 5 unsuccessful weeks.
      const scholasticStanding = createFakeStudentScholasticStanding(
        { submittedBy: student.user, application },
        {
          initialValues: { unsuccessfulWeeks: 5 },
        },
      );
      // Create a reversed scholastic standing with 3 unsuccessful weeks.
      // The 3 weeks from the reversed scholastic standing should not be included in the summary.
      const reversedScholasticStanding = createFakeStudentScholasticStanding(
        { submittedBy: student.user, application },
        {
          initialValues: {
            unsuccessfulWeeks: 3,
            reversalDate: new Date(),
          },
        },
      );
      await db.studentScholasticStanding.save([
        scholasticStanding,
        reversedScholasticStanding,
      ]);
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);
      const endpoint = "/students/scholastic-standing/summary";
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          fullTimeLifetimeUnsuccessfulCompletionWeeks: 5,
          partTimeLifetimeUnsuccessfulCompletionWeeks: 0,
        });
    },
  );
});
