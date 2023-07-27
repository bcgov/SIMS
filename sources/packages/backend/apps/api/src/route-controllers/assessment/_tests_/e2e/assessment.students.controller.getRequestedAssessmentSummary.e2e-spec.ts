import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
  getStudentToken,
} from "../../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppealRequest,
  createFakeStudentAppeal,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  AssessmentTriggerType,
  Student,
  StudentAppealStatus,
} from "@sims/sims-db";

describe("AssessmentStudentsController(e2e)-getRequestedAssessmentSummary", () => {
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

  it("Should get the student assessment requests summary for an eligible application for a student when they try to access it.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    // Create a declined student appeal.
    const declinedAppealRequest = createFakeStudentAppealRequest();
    declinedAppealRequest.appealStatus = StudentAppealStatus.Declined;
    const declinedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [declinedAppealRequest],
    });
    await db.studentAppeal.save(declinedAppeal);
    // Create an approved student appeal.
    const approvedAppealRequest = createFakeStudentAppealRequest();
    const approvedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [approvedAppealRequest],
    });
    await db.studentAppeal.save(approvedAppeal);
    // Create a pending student appeal.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await db.studentAppeal.save(pendingAppeal);
    // Create approved application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        application,
      },
      {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.Approved,
        },
      },
    );
    // Create declined application offering change request.
    const declinedApplicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          application,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          },
        },
      );
    // Create pending application offering change request.
    const pendingApplicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, { application });
    const endpoint = `/students/assessment/application/${application.id}/requests`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          id: pendingAppeal.id,
          submittedDate: pendingAppeal.submittedDate.toISOString(),
          status: StudentAppealStatus.Pending,
          requestType: AssessmentTriggerType.StudentAppeal,
        },
        {
          id: declinedAppeal.id,
          submittedDate: declinedAppeal.submittedDate.toISOString(),
          status: StudentAppealStatus.Declined,
          requestType: AssessmentTriggerType.StudentAppeal,
        },
        {
          id: declinedApplicationOfferingChangeRequest.id,
          submittedDate:
            declinedApplicationOfferingChangeRequest.createdAt.toISOString(),
          status: ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          requestType: AssessmentTriggerType.ApplicationOfferingChange,
        },
        {
          id: pendingApplicationOfferingChangeRequest.id,
          submittedDate:
            pendingApplicationOfferingChangeRequest.createdAt.toISOString(),
          status: ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          requestType: AssessmentTriggerType.ApplicationOfferingChange,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
