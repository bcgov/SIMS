import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  authorizeDynamicFormConfigurations,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
} from "@sims/test-utils";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  User,
} from "@sims/sims-db";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";
import { TestingModule } from "@nestjs/testing";
import { FormSubmissionAuthRoles } from "../../../../services";

describe("FormSubmissionAESTController(e2e)-getFormSubmission", () => {
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

  it("Should get a form submission as pending, its decisions and history when the form has multiple decisions and the user has approval authorization.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          // Should be returned as Approved, even though the final decision
          // has not been made yet, since the user has approval authorization.
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
        {
          // Should be returned as Pending since it has no decision.
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const [itemADecision1, itemADecision2] = formSubmissionItemA.decisions;
    const endpoint = `/aest/form-submission/${formSubmission.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    await authorizeDynamicFormConfigurations(
      appModule,
      [
        formConfigs.studentAppealApplicationA,
        formConfigs.studentAppealApplicationB,
      ],
      [
        FormSubmissionAuthRoles.ViewFormSubmittedData,
        FormSubmissionAuthRoles.ViewDecisionHistory,
        FormSubmissionAuthRoles.AssessItemDecision,
      ],
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasAssessFinalDecisionAuthorization: false,
          id: formSubmission.id,
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Pending,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              hasAssessItemDecisionAuthorization: true,
              id: formSubmissionItemA.id,
              formType: formConfigs.studentAppealApplicationA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                id: itemADecision1.id,
                decisionStatus: FormSubmissionDecisionStatus.Approved,
                decisionDate: itemADecision1.decisionDate.toISOString(),
                decisionBy: `${itemADecision1.decisionBy.firstName} ${itemADecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemADecision2.id,
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
                  decisionDate: itemADecision2.decisionDate.toISOString(),
                  decisionBy: `${itemADecision2.decisionBy.firstName} ${itemADecision2.decisionBy.lastName}`,
                  decisionNoteDescription:
                    itemADecision2.decisionNote.description,
                },
              ],
            },
            {
              hasAssessItemDecisionAuthorization: true,
              id: formSubmissionItemB.id,
              formType: formConfigs.studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationB.formDefinitionName,
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
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
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
    await authorizeDynamicFormConfigurations(
      appModule,
      [formConfigs.studentAppealA],
      [FormSubmissionAuthRoles.ViewFormSubmittedData],
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasAssessFinalDecisionAuthorization: false,
          id: formSubmission.id,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Pending,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              hasAssessItemDecisionAuthorization: false,
              id: formSubmissionItemA.id,
              formType: formConfigs.studentAppealA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: formConfigs.studentAppealA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: formConfigs.studentAppealA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
          ],
        }),
      );
  });

  it("Should get a form submission as completed, and its decision statuses, including decision notes when the user does not have approval authorization.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Completed,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
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
    await authorizeDynamicFormConfigurations(
      appModule,
      [formConfigs.studentAppealA],
      [FormSubmissionAuthRoles.ViewFormSubmittedData],
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toStrictEqual({
          hasAssessFinalDecisionAuthorization: false,
          id: formSubmission.id,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Completed,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              hasAssessItemDecisionAuthorization: false,
              id: formSubmissionItemA.id,
              formType: formConfigs.studentAppealA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId: formConfigs.studentAppealA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: formConfigs.studentAppealA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
            },
          ],
        });
      });
  });

  it("Should get a form submission as completed, and its decision statuses, including current notes and audit when the user has approval authorization.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
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
    await authorizeDynamicFormConfigurations(
      appModule,
      [formConfigs.studentFormA],
      [
        FormSubmissionAuthRoles.ViewFormSubmittedData,
        FormSubmissionAuthRoles.ViewDecisionHistory,
        FormSubmissionAuthRoles.AssessItemDecision,
      ],
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toStrictEqual({
          hasAssessFinalDecisionAuthorization: false,
          id: formSubmission.id,
          formCategory: FormCategory.StudentForm,
          status: FormSubmissionStatus.Completed,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              hasAssessItemDecisionAuthorization: true,
              id: formSubmissionItemA.id,
              formType: formConfigs.studentFormA.formType,
              formCategory: FormCategory.StudentForm,
              dynamicFormConfigurationId: formConfigs.studentFormA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName: formConfigs.studentFormA.formDefinitionName,
              updatedAt: formSubmissionItemA.updatedAt.toISOString(),
              currentDecision: {
                id: itemADecision1.id,
                decisionStatus: FormSubmissionDecisionStatus.Approved,
                decisionDate: itemADecision1.decisionDate.toISOString(),
                decisionBy: `${itemADecision1.decisionBy.firstName} ${itemADecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemADecision2.id,
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
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

  it("Should get a form submission item, and its decision statuses, including current notes and audit when the user has approval authorization and an item ID was provided.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Completed,
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
        {
          // This will be the item returned in the response, as its ID will be provided in the query parameter.
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
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
    await authorizeDynamicFormConfigurations(
      appModule,
      [
        formConfigs.studentAppealApplicationA,
        formConfigs.studentAppealApplicationB,
      ],
      [
        FormSubmissionAuthRoles.ViewFormSubmittedData,
        FormSubmissionAuthRoles.ViewDecisionHistory,
        FormSubmissionAuthRoles.AssessItemDecision,
      ],
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body).toStrictEqual({
          hasAssessFinalDecisionAuthorization: false,
          id: formSubmission.id,
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Completed,
          submittedDate: formSubmission.submittedDate.toISOString(),
          submissionItems: [
            {
              hasAssessItemDecisionAuthorization: true,
              id: formSubmissionItemB.id,
              formType: formConfigs.studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationB.formDefinitionName,
              updatedAt: formSubmissionItemB.updatedAt.toISOString(),
              currentDecision: {
                id: itemBDecision1.id,
                decisionStatus: FormSubmissionDecisionStatus.Declined,
                decisionDate: itemBDecision1.decisionDate.toISOString(),
                decisionBy: `${itemBDecision1.decisionBy.firstName} ${itemBDecision1.decisionBy.lastName}`,
                decisionNoteDescription:
                  itemBDecision1.decisionNote.description,
              },
              previousDecisions: [
                {
                  id: itemBDecision2.id,
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
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
