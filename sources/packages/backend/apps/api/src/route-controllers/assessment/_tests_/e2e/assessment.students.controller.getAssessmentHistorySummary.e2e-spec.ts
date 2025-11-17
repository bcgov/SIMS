import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { TestingModule } from "@nestjs/testing";

describe("AssessmentStudentsController(e2e)-getAssessmentHistorySummary", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let institutionUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    institutionUser = await db.user.save(createFakeUser());
  });

  it("Should get the student assessment history summary including multiple unsuccessful weeks scholastic standings when the student has an original assessment and multiple unsuccessful scholastic standings.", async () => {
    // Arrange
    const [twoDaysAgo, yesterday, today] = [-2, -1, 0].map((increment) =>
      addDays(increment),
    );
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
      currentAssessmentInitialValues: { submittedDate: twoDaysAgo },
    });
    const originalAssessment = application.currentAssessment;
    // Create a scholastic standing for today to allow asserting the proper return order.
    const todayScholasticStanding = createFakeStudentScholasticStanding(
      {
        submittedBy: institutionUser,
        application,
      },
      { initialValues: { unsuccessfulWeeks: 10, submittedDate: today } },
    );
    await db.studentScholasticStanding.save(todayScholasticStanding);
    // Create a scholastic standing older than the previous one to check the order.
    const yesterdayScholasticStanding = createFakeStudentScholasticStanding(
      {
        submittedBy: institutionUser,
        application,
      },
      { initialValues: { unsuccessfulWeeks: 10, submittedDate: yesterday } },
    );
    await db.studentScholasticStanding.save(yesterdayScholasticStanding);
    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, application.student);
    const endpoint = `/students/assessment/application/${application.id}/history`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          submittedDate: today.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          status: StudentAssessmentStatus.Completed,
          studentScholasticStandingId: todayScholasticStanding.id,
          hasUnsuccessfulWeeks: true,
        },
        {
          submittedDate: yesterday.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          status: StudentAssessmentStatus.Completed,
          studentScholasticStandingId: yesterdayScholasticStanding.id,
          hasUnsuccessfulWeeks: true,
        },
        {
          assessmentId: originalAssessment.id,
          submittedDate: twoDaysAgo.toISOString(),
          triggerType: AssessmentTriggerType.OriginalAssessment,
          assessmentDate: originalAssessment.assessmentDate,
          status: "Submitted",
          offeringId: originalAssessment.offering.id,
          programId: originalAssessment.offering.educationProgram.id,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
