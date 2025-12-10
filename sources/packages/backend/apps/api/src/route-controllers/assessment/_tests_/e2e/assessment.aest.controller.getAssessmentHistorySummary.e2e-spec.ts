import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAssessment,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("AssessmentAestController(e2e)-getAssessmentHistorySummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let institutionUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    institutionUser = await db.user.save(createFakeUser());
  });

  it("Should get the student assessment history summary including Original Assessment, Unsuccessful Completion and reversed Unsuccessful Completion.", async () => {
    // Arrange
    const [twoDaysAgo, yesterday, today] = [-2, -1, 0].map((increment) =>
      addDays(increment),
    );

    // Create the application and original assessment.
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
      currentAssessmentInitialValues: { submittedDate: twoDaysAgo },
    });
    const originalAssessment = application.currentAssessment;
    const offering = application.currentAssessment.offering;

    // Create a Unsuccessful Completion scholastic standing that has been reversed.
    const unsuccessfulCompletionScholasticStanding =
      createFakeStudentScholasticStanding(
        {
          submittedBy: institutionUser,
          application,
        },
        {
          initialValues: {
            submittedDate: yesterday,
            changeType:
              StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
            unsuccessfulWeeks: 8,
            reversalDate: today,
          },
        },
      );
    await db.studentScholasticStanding.save(
      unsuccessfulCompletionScholasticStanding,
    );

    // Create Scholastic Change Reversal assessment.
    const reversalAssessment = createFakeStudentAssessment(
      {
        auditUser: institutionUser,
        application,
        offering: offering,
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

    const endpoint = `/aest/assessment/application/${application.id}/history`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          // Scholastic Standing Reversal Assessment.
          assessmentId: reversalAssessment.id,
          submittedDate: today.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingReversal,
          assessmentDate: reversalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Completed,
          offeringId: offering.id,
          programId: offering.educationProgram.id,
        },
        {
          // Unsuccessful Completion Scholastic Standing Change.
          submittedDate: yesterday.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          status: StudentAssessmentStatus.Completed,
          studentScholasticStandingId:
            unsuccessfulCompletionScholasticStanding.id,
          hasUnsuccessfulWeeks: true,
          scholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          scholasticStandingReversalDate: today.toISOString(),
        },
        {
          // Original Assessment.
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
