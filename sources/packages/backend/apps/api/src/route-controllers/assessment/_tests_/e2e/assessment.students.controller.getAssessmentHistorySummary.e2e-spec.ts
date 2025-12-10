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
  createFakeEducationProgramOffering,
  createFakeStudentAssessment,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  OfferingTypes,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
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
          scholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          scholasticStandingReversalDate: null,
        },
        {
          submittedDate: yesterday.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          status: StudentAssessmentStatus.Completed,
          studentScholasticStandingId: yesterdayScholasticStanding.id,
          hasUnsuccessfulWeeks: true,
          scholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          scholasticStandingReversalDate: null,
        },
        {
          assessmentId: originalAssessment.id,
          submittedDate: twoDaysAgo.toISOString(),
          triggerType: AssessmentTriggerType.OriginalAssessment,
          assessmentDate: originalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Submitted,
          offeringId: originalAssessment.offering.id,
          programId: originalAssessment.offering.educationProgram.id,
        },
      ]);
  });
  it("Should get the student assessment history summary including a Withdrawal and reversed Withdrawal.", async () => {
    // Arrange
    // Define the actual study period dates.
    const studyStartDate = getISODateOnlyString(new Date());
    const studyEndDate = getISODateOnlyString(addDays(60));

    const [twoDaysAgo, yesterday, today] = [-2, -1, 0].map((increment) =>
      addDays(increment),
    );

    // Create the application and original assessment.
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
      currentAssessmentInitialValues: { submittedDate: twoDaysAgo },
      offeringInitialValues: { studyStartDate, studyEndDate },
    });
    const originalAssessment = application.currentAssessment;
    const offeringBeforeWithdrawal = application.currentAssessment.offering;

    // Create an offering for withdrawal.
    const withdrawalDate = getISODateOnlyString(addDays(-10, studyEndDate));
    const withdrawalOffering = createFakeEducationProgramOffering(
      {
        auditUser: institutionUser,
      },
      {
        initialValues: {
          studyStartDate,
          studyEndDate: withdrawalDate,
          parentOffering: offeringBeforeWithdrawal.parentOffering,
          offeringType: OfferingTypes.ScholasticStanding,
        },
      },
    );
    await db.educationProgramOffering.save(withdrawalOffering);

    // Create a new assessment using the withdrawal offering.
    const withdrawalAssessment = createFakeStudentAssessment(
      {
        auditUser: institutionUser,
        application,
        offering: withdrawalOffering,
      },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          submittedDate: yesterday,
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
        },
      },
    );

    // Create a Withdrawal scholastic standing that has been reversed.
    const withdrawalScholasticStanding = createFakeStudentScholasticStanding(
      {
        submittedBy: institutionUser,
        application,
        studentAssessment: withdrawalAssessment,
      },
      {
        initialValues: {
          submittedDate: yesterday,
          changeType:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          reversalDate: today,
        },
      },
    );
    await db.studentScholasticStanding.save(withdrawalScholasticStanding);

    // Create an assessment for the Withdrawal scholastic standing reversal.
    const reversalAssessment = createFakeStudentAssessment(
      {
        auditUser: institutionUser,
        application,
        offering: offeringBeforeWithdrawal,
      },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
          submittedDate: today,
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
        },
      },
    );
    await db.studentAssessment.save(reversalAssessment);

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
          assessmentId: reversalAssessment.id,
          submittedDate: today.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          assessmentDate: reversalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Completed,
          offeringId: offeringBeforeWithdrawal.id,
          programId: offeringBeforeWithdrawal.educationProgram.id,
        },
        {
          assessmentId: withdrawalAssessment.id,
          submittedDate: yesterday.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          assessmentDate: withdrawalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Completed,
          offeringId: withdrawalOffering.id,
          programId: withdrawalOffering.educationProgram.id,
          studentScholasticStandingId: withdrawalScholasticStanding.id,
          scholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
          scholasticStandingReversalDate: today.toISOString(),
        },
        {
          assessmentId: originalAssessment.id,
          submittedDate: twoDaysAgo.toISOString(),
          triggerType: AssessmentTriggerType.OriginalAssessment,
          assessmentDate: originalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Submitted,
          offeringId: originalAssessment.offering.id,
          programId: originalAssessment.offering.educationProgram.id,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
