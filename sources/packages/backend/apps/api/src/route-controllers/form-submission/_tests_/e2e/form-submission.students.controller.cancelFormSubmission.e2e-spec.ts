import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getAESTUser,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import MockDate from "mockdate";
import {
  FormCategory,
  FormSubmission,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  User,
} from "@sims/sims-db";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";
import {
  FORM_SUBMISSION_NOT_PENDING,
  FORM_SUBMISSION_WITH_MINISTRY_DECISION,
} from "../../../../services";

describe("FormSubmissionStudentsController(e2e)-cancelFormSubmission", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let ministryUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  beforeEach(async () => {
    MockDate.reset();
    await resetMockJWTUserInfo(appModule);
  });

  it(`Should cancel a student application appeal when the form submission status is ${FormSubmissionStatus.Pending} with no ministry decisions on the form submission items.`, async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [],
        },
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
          decisions: [],
        },
      ],
    });

    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Mock the current date to verify the audit fields.
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify the DB updates.
    await assertDBUpdatesOnCancellation(db, formSubmission, now);
  });

  it(`Should cancel a student appeal when the form submission status is ${FormSubmissionStatus.Pending} with no ministry decisions on the form submission items.`, async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
          decisions: [],
        },
      ],
    });

    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Mock the current date to verify the audit fields.
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify the DB updates.
    await assertDBUpdatesOnCancellation(db, formSubmission, now);
  });

  it(`Should cancel a student form when the form submission status is ${FormSubmissionStatus.Pending} with no ministry decisions on the form submission items.`, async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [],
        },
      ],
    });

    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Mock the current date to verify the audit fields.
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify the DB updates.
    await assertDBUpdatesOnCancellation(db, formSubmission, now);
  });
  [FormSubmissionStatus.Completed, FormSubmissionStatus.Declined].forEach(
    (status) => {
      it(`Should throw unprocessable entity error when trying to cancel a form submission with submission status ${status}.`, async () => {
        // Arrange
        const formSubmission = await saveFakeFormSubmissionFromInputTestData(
          db,
          {
            formCategory: FormCategory.StudentForm,
            submissionStatus: status,
            ministryAuditUser: ministryUser,
            formSubmissionItems: [
              {
                dynamicFormConfiguration: formConfigs.studentFormA,
                decisions: [
                  {
                    decisionStatus: FormSubmissionDecisionStatus.Approved,
                  },
                ],
              },
            ],
          },
        );
        const studentToken = await getStudentToken(
          FakeStudentUsersTypes.FakeStudentUserType1,
        );
        // Mock the user received in the token.
        await mockJWTUserInfo(appModule, formSubmission.student.user);

        // Act/Assert
        await request(app.getHttpServer())
          .patch(getEndpoint(formSubmission.id))
          .auth(studentToken, BEARER_AUTH_TYPE)
          .expect(HttpStatus.UNPROCESSABLE_ENTITY)
          .expect({
            message: `Form submission with ID ${formSubmission.id} is not in pending status and cannot be cancelled.`,
            errorType: FORM_SUBMISSION_NOT_PENDING,
          });
      });
    },
  );

  it("Should throw unprocessable entity error when trying to cancel a pending student form with a ministry decision.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Pending,
            },
          ],
        },
      ],
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Form submission with ID ${formSubmission.id} has one or more form submission items with ministry decisions and cannot be cancelled.`,
        errorType: FORM_SUBMISSION_WITH_MINISTRY_DECISION,
      });
  });

  it("Should throw unprocessable entity error when trying to cancel a student form that is already cancelled.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Cancelled,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [],
        },
      ],
    });
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Form submission with ID ${formSubmission.id} is already cancelled.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw not found error when trying to cancel a non-existent form submission.", async () => {
    // Arrange
    const formSubmissionId = 9999999;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmissionId))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Form submission with ID ${formSubmissionId} not found.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

function getEndpoint(formSubmissionId: number): string {
  return `/students/form-submission/${formSubmissionId}/cancel`;
}

/**
 * Assert the DB updates on a form submission cancellation.
 * @param db E2E dataSources.
 * @param formSubmission form submission to assert the DB updates.
 * @param auditDate The date to assert against the audit fields in the DB.
 */
async function assertDBUpdatesOnCancellation(
  db: E2EDataSources,
  formSubmission: FormSubmission,
  auditDate: Date,
): Promise<void> {
  const updatedFormSubmission = await db.formSubmission.findOne({
    select: {
      id: true,
      submissionStatus: true,
      submissionStatusUpdatedBy: { id: true },
      submissionStatusUpdatedOn: true,
      modifier: { id: true },
      updatedAt: true,
    },
    where: { id: formSubmission.id },
    relations: { submissionStatusUpdatedBy: true, modifier: true },
    loadEagerRelations: false,
  });
  const expectedAuditUser = { id: formSubmission.student.user.id };
  expect(updatedFormSubmission).toEqual({
    id: formSubmission.id,
    submissionStatus: FormSubmissionStatus.Cancelled,
    submissionStatusUpdatedBy: expectedAuditUser,
    submissionStatusUpdatedOn: auditDate,
    modifier: expectedAuditUser,
    updatedAt: auditDate,
  });
}
