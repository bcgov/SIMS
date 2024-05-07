import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
} from "../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  createE2EDataSources,
  E2EDataSources,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  Student,
} from "@sims/sims-db";

describe("ApplicationStudentsController(e2e)-getEnrolmentApplicationDetails", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should get application progress details when the current assessment trigger type is 'Related application changed'.", async () => {
    // Arrange

    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;

    application.currentAssessment.triggerType =
      AssessmentTriggerType.RelatedApplicationChanged;
    await db.application.save(application);

    const endpoint = `/students/application/${application.id}/enrolment`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        firstDisbursement: {
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        },
        secondDisbursement: {
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        },
        assessmentTriggerType: AssessmentTriggerType.RelatedApplicationChanged,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
