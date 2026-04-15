import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getRecentActiveProgramYear,
  getStudentByFakeStudentUserType,
  getStudentToken,
  mockJWTUserInfo,
} from "../../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppealRequest,
  createFakeStudentAppeal,
  saveFakeApplicationOfferingRequestChange,
  ensureDynamicFormConfigurationExists,
  saveFakeFormSubmissionFromInputTestData,
  saveFakeApplication,
  createFakeUser,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  ProgramYear,
  Student,
  StudentAppealStatus,
} from "@sims/sims-db";
import { RequestAssessmentTypeAPIOutDTO } from "../../../assessment/models/assessment.dto";
import { TestingModule } from "@nestjs/testing";
import { addDays } from "@sims/utilities";

describe("AssessmentStudentsController(e2e)-getRequestedAssessmentSummary", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let student: Student;
  let studentAppealA: DynamicFormConfiguration;
  let recentActiveProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
    recentActiveProgramYear = await getRecentActiveProgramYear(db);
    studentAppealA = await ensureDynamicFormConfigurationExists(
      db,
      "Student Appeal A",
      {
        formCategory: FormCategory.StudentAppeal,
        hasApplicationScope: true,
        allowBundledSubmission: true,
      },
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
          id: pendingApplicationOfferingChangeRequest.id,
          submittedDate:
            pendingApplicationOfferingChangeRequest.createdAt.toISOString(),
          status: ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          requestType:
            RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest,
        },
        {
          id: declinedApplicationOfferingChangeRequest.id,
          submittedDate:
            declinedApplicationOfferingChangeRequest.createdAt.toISOString(),
          status: ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
          requestType:
            RequestAssessmentTypeAPIOutDTO.ApplicationOfferingChangeRequest,
        },
        {
          id: pendingAppeal.id,
          submittedDate: pendingAppeal.submittedDate.toISOString(),
          status: StudentAppealStatus.Pending,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentAppeal,
        },
        {
          id: declinedAppeal.id,
          submittedDate: declinedAppeal.submittedDate.toISOString(),
          status: StudentAppealStatus.Declined,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentAppeal,
        },
      ]);
  });

  it("Should get a pending and a declined form submission appeal requests when the student has a pending and declined form submission appeal.", async () => {
    // Arrange
    const auditUser = await db.user.save(createFakeUser());
    const application = await saveFakeApplication(
      db.dataSource,
      {
        programYear: recentActiveProgramYear,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const [pendingFormSubmission, declinedFormSubmission] = await Promise.all(
      [FormSubmissionStatus.Pending, FormSubmissionStatus.Declined].map(
        (status, index) =>
          saveFakeFormSubmissionFromInputTestData(db, {
            now: addDays(index),
            ministryAuditUser: auditUser,
            application,
            formCategory: FormCategory.StudentAppeal,
            submissionStatus: status,
            formSubmissionItems: [
              {
                dynamicFormConfiguration: studentAppealA,
                decisions: [
                  {
                    decisionStatus:
                      status === FormSubmissionStatus.Pending
                        ? FormSubmissionDecisionStatus.Pending
                        : FormSubmissionDecisionStatus.Declined,
                  },
                ],
              },
            ],
          }),
      ),
    );
    const endpoint = `/students/assessment/application/${application.id}/requests`;
    await mockJWTUserInfo(appModule, application.student.user);
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
          id: declinedFormSubmission.id,
          submittedDate: declinedFormSubmission.submittedDate.toISOString(),
          status: FormSubmissionStatus.Declined,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentFormSubmission,
        },
        {
          id: pendingFormSubmission.id,
          submittedDate: pendingFormSubmission.submittedDate.toISOString(),
          status: FormSubmissionStatus.Pending,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentFormSubmission,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
