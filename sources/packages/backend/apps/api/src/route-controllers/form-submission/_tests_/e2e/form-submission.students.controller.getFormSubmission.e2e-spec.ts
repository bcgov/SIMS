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
  ensureDynamicFormConfigurationExists,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  User,
} from "@sims/sims-db";

describe("FormSubmissionStudentsController(e2e)-getFormSubmission", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let ministryUser: User;
  let studentAppealApplicationA: DynamicFormConfiguration;
  let studentAppealApplicationB: DynamicFormConfiguration;

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
    // Create the form configurations to be used along the tests.
    [studentAppealApplicationA, studentAppealApplicationB] = await Promise.all([
      ensureDynamicFormConfigurationExists(db, "Student application appeal A", {
        formCategory: FormCategory.StudentAppeal,
      }),
      ensureDynamicFormConfigurationExists(db, "Student application appeal B", {
        formCategory: FormCategory.StudentAppeal,
      }),
    ]);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get a form submission as pending and its decisions as pending when the final decision is not yet made and there is an approved and a pending decision (no decision set).", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      auditUser: ministryUser,
      formSubmissionItems: [
        {
          // Should be Pending as the final decision was not yet made.
          dynamicFormConfiguration: studentAppealApplicationA,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Approved,
            },
          ],
        },
        {
          // Should be pending as it has no decision.
          dynamicFormConfiguration: studentAppealApplicationB,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const endpoint = `/students/form-submission/${formSubmission.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          id: formSubmission.id,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Pending,
          submittedDate: formSubmission.submittedDate.toISOString(),
          assessedDate: null,
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentAppealApplicationA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentAppealApplicationA.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
            {
              id: formSubmissionItemB.id,
              formType: studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName: studentAppealApplicationB.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
          ],
        }),
      );
  });

  it("Should get a form submission as completed and its decisions statuses when form submission is completed.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Completed,
      auditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: studentAppealApplicationA,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Approved,
            },
          ],
        },
        {
          dynamicFormConfiguration: studentAppealApplicationB,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Declined,
            },
          ],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const endpoint = `/students/form-submission/${formSubmission.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          id: formSubmission.id,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Completed,
          submittedDate: formSubmission.submittedDate.toISOString(),
          assessedDate: formSubmission.assessedDate?.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentAppealApplicationA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentAppealApplicationA.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
              },
            },
            {
              id: formSubmissionItemB.id,
              formType: studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName: studentAppealApplicationB.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
              },
            },
          ],
        }),
      );
  });

  it("Should throw a not found exception when the form submission ID belongs to another student.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      auditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: studentAppealApplicationA,
          decisions: [],
        },
      ],
    });
    const endpoint = `/students/form-submission/${formSubmission.id}`;
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Form submission with ID ${formSubmission.id} not found.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a not found exception when the form submission ID does not exist.", async () => {
    // Arrange
    const endpoint = "/students/form-submission/9999999";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Form submission with ID 9999999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
