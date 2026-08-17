import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getAESTUser,
  getStudentToken,
  mockJWTUserInfo,
  mockUserLoginInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  FormCategory,
  FormSubmissionCancellationReason,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import MockDate from "mockdate";
import { beforeEach } from "node:test";
import {
  DynamicConfigurationTestData,
  createFakeFormConfigurations,
} from "../../../form-submission/_tests_/e2e/form-submission-utils";
import {
  assertCancelledApplicationScopedFormSubmissions,
  assertFormSubmissionNotUpdated,
} from "./application-form-submission-utils";

describe("ApplicationStudentsController(e2e)-cancelStudentApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let ministryUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
    MockDate.reset();
  });

  it(
    `Should cancel a student application and update the current assessment status to ${StudentAssessmentStatus.CancellationRequested}` +
      ` when the application has current assessment created and application status is ${ApplicationStatus.Assessment}`,
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Assessment,
      });
      const student = application.student;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, student.user);
      const now = new Date();
      MockDate.set(now);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(getEndpoint(application.id))
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      const cancelledApplication = await db.application.findOne({
        select: {
          id: true,
          applicationStatus: true,
          applicationStatusUpdatedOn: true,
          modifier: { id: true },
          updatedAt: true,
          currentAssessment: {
            id: true,
            studentAssessmentStatus: true,
            studentAssessmentStatusUpdatedOn: true,
            modifier: { id: true },
            updatedAt: true,
          },
        },
        relations: {
          modifier: true,
          currentAssessment: { modifier: true },
        },
        where: { id: application.id },
        loadEagerRelations: false,
      });
      const auditUser = { id: student.user.id };
      // Expected updated fields.
      expect(cancelledApplication).toEqual({
        id: application.id,
        applicationStatus: ApplicationStatus.Cancelled,
        applicationStatusUpdatedOn: now,
        modifier: auditUser,
        updatedAt: now,
        currentAssessment: {
          id: application.currentAssessment.id,
          studentAssessmentStatus:
            StudentAssessmentStatus.CancellationRequested,
          studentAssessmentStatusUpdatedOn: now,
          modifier: auditUser,
          updatedAt: now,
        },
      });
    },
  );

  [
    FormSubmissionStatus.Pending,
    FormSubmissionStatus.Completed,
    FormSubmissionStatus.Declined,
  ].forEach((submissionStatus) => {
    it(
      "Should cancel a student application and also cancel the application scoped form submission" +
        ` when application status is ${ApplicationStatus.Assessment} and the application has a form submission with submission status ${submissionStatus}.`,
      async () => {
        // Arrange
        const application = await saveFakeApplication(
          db.dataSource,
          undefined,
          {
            applicationStatus: ApplicationStatus.Assessment,
          },
        );
        const student = application.student;
        const formSubmission = await saveFakeFormSubmissionFromInputTestData(
          db,
          {
            now: new Date(),
            student,
            application,
            formCategory: FormCategory.StudentAppeal,
            submissionStatus,
            ministryAuditUser: ministryUser,
            formSubmissionItems: [
              {
                dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
                decisions: [
                  {
                    decisionStatus: FormSubmissionDecisionStatus.Approved,
                  },
                ],
              },
            ],
          },
        );
        const token = await getStudentToken(
          FakeStudentUsersTypes.FakeStudentUserType1,
        );
        await mockJWTUserInfo(appModule, student.user);
        const now = new Date();
        MockDate.set(now);

        // Act/Assert
        await request(app.getHttpServer())
          .patch(getEndpoint(application.id))
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK);

        // Verify if the application is cancelled.
        const isApplicationCancelled = await db.application.exists({
          where: {
            id: application.id,
            applicationStatus: ApplicationStatus.Cancelled,
          },
        });
        expect(isApplicationCancelled).toBe(true);

        // Verify if all the application scoped form submissions are cancelled.
        await assertCancelledApplicationScopedFormSubmissions(
          db,
          application.id,
          FormSubmissionCancellationReason.ApplicationCancelled,
          [formSubmission.id],
          student.user.id,
          now,
        );
      },
    );
  });

  it(
    "Should cancel a student application but not update the application scoped form submission" +
      ` when application status is ${ApplicationStatus.Assessment} and the application has a form submission that is already cancelled.`,
    async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus: ApplicationStatus.Assessment,
      });
      const student = application.student;
      const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
        now: new Date(),
        student,
        application,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Cancelled,
        cancellationReason:
          FormSubmissionCancellationReason.StudentCancelledSubmission,
        ministryAuditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
              },
            ],
          },
        ],
      });
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, student.user);
      const now = new Date();
      MockDate.set(now);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(getEndpoint(application.id))
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      // Verify if the application is cancelled.
      const isApplicationCancelled = await db.application.exists({
        where: {
          id: application.id,
          applicationStatus: ApplicationStatus.Cancelled,
        },
      });
      expect(isApplicationCancelled).toBe(true);
      // Verify if the application scoped form submission is not updated since it was already cancelled.
      await assertFormSubmissionNotUpdated(
        db,
        formSubmission.id,
        FormSubmissionCancellationReason.ApplicationCancelled,
        now,
      );
    },
  );

  [
    ApplicationStatus.Completed,
    ApplicationStatus.Cancelled,
    ApplicationStatus.Edited,
  ].forEach((applicationStatus) => {
    it(`Should throw a not found exception when the application status is ${applicationStatus}.`, async () => {
      // Arrange
      const application = await saveFakeApplication(db.dataSource, undefined, {
        applicationStatus,
      });
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockUserLoginInfo(appModule, application.student);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(getEndpoint(application.id))
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          message:
            "Application not found or it is not in the correct state to be cancelled.",
          error: "Not Found",
          statusCode: HttpStatus.NOT_FOUND,
        });
    });
  });

  it("Should throw a not found exception when the application does not belong to the student.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Assessment,
    });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(application.id))
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Application not found or it is not in the correct state to be cancelled.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a NotFoundException when the application does not exist.", async () => {
    // Arrange
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(9999999))
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Application not found or it is not in the correct state to be cancelled.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get the endpoint for cancelling a student application.
 * @param applicationId
 * @returns endpoint for cancelling a student application.
 */
function getEndpoint(applicationId: number): string {
  return `/students/application/${applicationId}/cancel`;
}
