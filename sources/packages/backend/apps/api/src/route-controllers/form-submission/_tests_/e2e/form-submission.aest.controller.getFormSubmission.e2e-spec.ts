import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
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

describe("FormSubmissionAESTController(e2e)-getFormSubmission", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let ministryUser: User;
  let studentAppealApplicationA: DynamicFormConfiguration;
  let studentAppealApplicationB: DynamicFormConfiguration;
  let studentFormApplication: DynamicFormConfiguration;

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
    [
      studentAppealApplicationA,
      studentAppealApplicationB,
      studentFormApplication,
    ] = await Promise.all([
      ensureDynamicFormConfigurationExists(db, "Student application appeal A", {
        formCategory: FormCategory.StudentAppeal,
      }),
      ensureDynamicFormConfigurationExists(db, "Student application appeal B", {
        formCategory: FormCategory.StudentAppeal,
      }),
      ensureDynamicFormConfigurationExists(db, "Student form application", {
        formCategory: FormCategory.StudentForm,
      }),
    ]);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it("Should get a form submission as pending, its decisions and history when the form has multiple decisions and the user has approval authorization.", async () => {
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
            {
              decisionStatus: FormSubmissionDecisionStatus.Pending,
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
    const [itemADecision1, itemADecision2] = formSubmissionItemA.decisions;
    const endpoint = `/aest/form-submission/${formSubmission.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasApprovalAuthorization: true,
          id: formSubmission.id,
          formCategory: formSubmission.formCategory,
          status: formSubmission.submissionStatus,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentAppealApplicationA.formType,
              formCategory: studentAppealApplicationA.formCategory,
              dynamicFormConfigurationId: studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentAppealApplicationA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                id: itemADecision1.id,
                decisionStatus: itemADecision1.decisionStatus,
                decisionDate: itemADecision1.decisionDate.toISOString(),
                decisionBy: `${itemADecision1.decisionBy.firstName} ${itemADecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemADecision2.id,
                  decisionStatus: itemADecision2.decisionStatus,
                  decisionDate: itemADecision2.decisionDate.toISOString(),
                  decisionBy: `${itemADecision2.decisionBy.firstName} ${itemADecision2.decisionBy.lastName}`,
                  decisionNoteDescription:
                    itemADecision2.decisionNote.description,
                },
              ],
            },
            {
              id: formSubmissionItemB.id,
              formType: studentAppealApplicationB.formType,
              formCategory: studentAppealApplicationB.formCategory,
              dynamicFormConfigurationId: studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName: studentAppealApplicationB.formDefinitionName,
              updatedAt: formSubmissionItemB.updatedAt.toISOString(),
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
              previousDecisions: [],
            },
          ],
        }),
      );
  });

  it("Should get a form submission as pending, and its decisions as pending without history when the form has multiple decisions, including an approved decision, and the user does not have approval authorization.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      auditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: studentAppealApplicationA,
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
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const endpoint = `/aest/form-submission/${formSubmission.id}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasApprovalAuthorization: false,
          id: formSubmission.id,
          formCategory: formSubmission.formCategory,
          status: formSubmission.submissionStatus,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentAppealApplicationA.formType,
              formCategory: studentAppealApplicationA.formCategory,
              dynamicFormConfigurationId: studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentAppealApplicationA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
          ],
        }),
      );
  });

  it("Should get a form submission as completed, and its decisions statuses, including current notes when the user does not have approval authorization.", async () => {
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
            {
              decisionStatus: FormSubmissionDecisionStatus.Pending,
            },
          ],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const [itemADecision1] = formSubmissionItemA.decisions;
    const endpoint = `/aest/form-submission/${formSubmission.id}`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toStrictEqual({
          hasApprovalAuthorization: false,
          id: formSubmission.id,
          formCategory: formSubmission.formCategory,
          status: formSubmission.submissionStatus,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentAppealApplicationA.formType,
              formCategory: studentAppealApplicationA.formCategory,
              dynamicFormConfigurationId: studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentAppealApplicationA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                decisionStatus: itemADecision1.decisionStatus,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
            },
          ],
        });
      });
  });

  it("Should get a form submission as completed, and its decisions statuses, including current notes and audit when the user has approval authorization.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Completed,
      auditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: studentFormApplication,
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
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const [itemADecision1, itemADecision2] = formSubmissionItemA.decisions;
    const endpoint = `/aest/form-submission/${formSubmission.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasApprovalAuthorization: true,
          id: formSubmission.id,
          formCategory: formSubmission.formCategory,
          status: formSubmission.submissionStatus,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: studentFormApplication.formType,
              formCategory: studentFormApplication.formCategory,
              dynamicFormConfigurationId: studentFormApplication.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: studentFormApplication.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                id: itemADecision1.id,
                decisionStatus: itemADecision1.decisionStatus,
                decisionDate: itemADecision1.decisionDate.toISOString(),
                decisionBy: `${itemADecision1.decisionBy.firstName} ${itemADecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemADecision2.id,
                  decisionStatus: itemADecision2.decisionStatus,
                  decisionDate: itemADecision2.decisionDate.toISOString(),
                  decisionBy: `${itemADecision2.decisionBy.firstName} ${itemADecision2.decisionBy.lastName}`,
                  decisionNoteDescription:
                    itemADecision2.decisionNote.description,
                },
              ],
            },
          ],
        }),
      );
  });

  it("Should get a form submission item, and its decisions statuses, including current notes and audit when the user has approval authorization and an item ID was provided.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
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
          // This will be the item returned in the response, as its ID will be provided in the query parameter.
          dynamicFormConfiguration: studentAppealApplicationB,
          decisions: [
            {
              decisionStatus: FormSubmissionDecisionStatus.Declined,
            },
            {
              decisionStatus: FormSubmissionDecisionStatus.Pending,
            },
          ],
        },
      ],
    });
    const [, formSubmissionItemB] = formSubmission.formSubmissionItems;
    const [itemBDecision1, itemBDecision2] = formSubmissionItemB.decisions;
    const endpoint = `/aest/form-submission/${formSubmission.id}?itemId=${formSubmissionItemB.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, formSubmission.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toStrictEqual({
          hasApprovalAuthorization: true,
          id: formSubmission.id,
          formCategory: formSubmission.formCategory,
          status: formSubmission.submissionStatus,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemB.id,
              formType: studentAppealApplicationB.formType,
              formCategory: studentAppealApplicationB.formCategory,
              dynamicFormConfigurationId: studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName: studentAppealApplicationB.formDefinitionName,
              updatedAt: formSubmissionItemB.updatedAt.toISOString(),
              currentDecision: {
                id: itemBDecision1.id,
                decisionStatus: itemBDecision1.decisionStatus,
                decisionDate: itemBDecision1.decisionDate.toISOString(),
                decisionBy: `${itemBDecision1.decisionBy.firstName} ${itemBDecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemBDecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemBDecision2.id,
                  decisionStatus: itemBDecision2.decisionStatus,
                  decisionDate: itemBDecision2.decisionDate.toISOString(),
                  decisionBy: `${itemBDecision2.decisionBy.firstName} ${itemBDecision2.decisionBy.lastName}`,
                  decisionNoteDescription:
                    itemBDecision2.decisionNote.description,
                },
              ],
            },
          ],
        });
      });
  });

  it("Should throw a not found exception when the form submission ID does not exist.", async () => {
    // Arrange
    const endpoint = "/aest/form-submission/9999999";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Form submission with ID 9999999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw a not found exception when the form submission ID or the item ID does not exist.", async () => {
    // Arrange
    const endpoint = "/aest/form-submission/9999999?itemId=8888888";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Form submission with ID 9999999 and form submission item ID 8888888 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
