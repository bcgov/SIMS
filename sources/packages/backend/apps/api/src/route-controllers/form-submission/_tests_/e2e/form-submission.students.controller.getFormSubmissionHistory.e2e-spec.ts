import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { TestingModule } from "@nestjs/testing";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";

describe("FormSubmissionStudentsController(e2e)-getFormSubmissionHistory", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let ministryUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get the form submission history including student appeals and student forms when the student has student appeals and forms previously submitted.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const application = await saveFakeApplication(db.dataSource, {
      student,
    });
    const [twoDaysAgo, yesterday, today] = [
      addDays(-2),
      addDays(-1),
      new Date(),
    ];
    // Pending student appeal with an associated application.
    // Expected to be returned, decisions as pending even being already assessed (not pending).
    const pendingStudentAppealPromise = saveFakeFormSubmissionFromInputTestData(
      db,
      {
        now: today,
        application,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Pending,
        ministryAuditUser: ministryUser,
        // Ensure items are added in alphabetical order DESC to
        // assert they will be returned in alphabetical order ASC.
        formSubmissionItems: [
          {
            // Should be pending as it has no decision.
            dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
              },
            ],
          },
          {
            // Create at least one form with decision history to ensure the data will not be returned.
            dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
              },
              {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            ],
          },
        ],
      },
    );
    // Completed student appeal, no application associated.
    // Expected to be returned, decisions as they were assessed (not pending).
    const completedStudentAppealPromise =
      saveFakeFormSubmissionFromInputTestData(db, {
        now: yesterday,
        student,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Completed,
        ministryAuditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
              },
            ],
          },
        ],
      });
    // Completed student form, no application associated.
    // Expected to be returned, decisions as they were assessed (not pending).
    const completedStudentFormPromise = saveFakeFormSubmissionFromInputTestData(
      db,
      {
        now: twoDaysAgo,
        student,
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Completed,
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
    const [pendingStudentAppeal, completedStudentAppeal, completedStudentForm] =
      await Promise.all([
        pendingStudentAppealPromise,
        completedStudentAppealPromise,
        completedStudentFormPromise,
      ]);
    const [pendingStudentAppealSavedItem1, pendingStudentAppealSavedItem2] =
      pendingStudentAppeal.formSubmissionItems;
    const [completedStudentAppealSavedItem1] =
      completedStudentAppeal.formSubmissionItems;
    const [completedStudentFormSavedItem1] =
      completedStudentForm.formSubmissionItems;
    const endpoint = "/students/form-submission";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.submissions).toEqual([
          // Pending Student Appeal
          {
            id: pendingStudentAppeal.id,
            applicationId: application.id,
            applicationNumber: application.applicationNumber,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Pending,
            submittedDate: pendingStudentAppeal.submittedDate.toISOString(),
            assessedDate: null,
            submissionItems: [
              {
                id: pendingStudentAppealSavedItem2.id,
                formType: formConfigs.studentAppealApplicationA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId:
                  formConfigs.studentAppealApplicationA.id,
                formDefinitionName:
                  formConfigs.studentAppealApplicationA.formDefinitionName,
                currentDecision: {
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
                },
              },
              {
                id: pendingStudentAppealSavedItem1.id,
                formType: formConfigs.studentAppealApplicationB.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId:
                  formConfigs.studentAppealApplicationB.id,
                formDefinitionName:
                  formConfigs.studentAppealApplicationB.formDefinitionName,
                currentDecision: {
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
                },
              },
            ],
          },
          // Completed Student Appeal
          {
            id: completedStudentAppeal.id,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Completed,
            submittedDate: completedStudentAppeal.submittedDate.toISOString(),
            assessedDate: completedStudentAppeal.assessedDate.toISOString(),
            submissionItems: [
              {
                id: completedStudentAppealSavedItem1.id,
                formType: formConfigs.studentAppealApplicationA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId:
                  formConfigs.studentAppealApplicationA.id,
                formDefinitionName:
                  formConfigs.studentAppealApplicationA.formDefinitionName,
                currentDecision: {
                  decisionStatus: FormSubmissionDecisionStatus.Declined,
                },
              },
            ],
          },
          // Completed Student Form
          {
            id: completedStudentForm.id,
            formCategory: FormCategory.StudentForm,
            status: FormSubmissionStatus.Completed,
            submittedDate: completedStudentForm.submittedDate.toISOString(),
            assessedDate: completedStudentForm.assessedDate.toISOString(),
            submissionItems: [
              {
                id: completedStudentFormSavedItem1.id,
                formType: formConfigs.studentFormA.formType,
                formCategory: FormCategory.StudentForm,
                dynamicFormConfigurationId: formConfigs.studentFormA.id,
                formDefinitionName: formConfigs.studentFormA.formDefinitionName,
                currentDecision: {
                  decisionStatus: FormSubmissionDecisionStatus.Approved,
                },
              },
            ],
          },
        ]),
      );
  });

  afterAll(async () => {
    await app?.close();
  });
});
