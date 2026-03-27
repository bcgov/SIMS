import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
  removeJWTUserRoles,
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
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  NoteType,
  User,
} from "@sims/sims-db";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";
import MockDate from "mockdate";
import { addDays } from "@sims/utilities";
import { FORM_SUBMISSION_ITEM_OUTDATED } from "../../../../services";
import { TestingModule } from "@nestjs/testing";
import { Role } from "../../../../auth/roles.enum";

describe("FormSubmissionAESTController(e2e)-submitItemDecision", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let ministryAdminUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    ministryAdminUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should submit an item decision when there is no decision yet and the user has approval authorization.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const application = await saveFakeApplication(db.dataSource, null, {
      initialValues: { applicationStatus: ApplicationStatus.Completed },
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      now,
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const ministryAuditUser = { id: ministryAdminUser.id };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check the updated current decision of the form submission item.
    const updatedFormSubmissionItem = await db.formSubmissionItem.findOne({
      select: {
        id: true,
        currentDecision: {
          id: true,
          decisionStatus: true,
          decisionBy: { id: true },
          decisionDate: true,
          createdAt: true,
          creator: { id: true },
          decisionNote: {
            id: true,
            description: true,
            noteType: true,
            createdAt: true,
            creator: { id: true },
          },
        },
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        currentDecision: {
          decisionBy: true,
          creator: true,
          decisionNote: { creator: true },
        },
        modifier: true,
      },
      where: { id: formSubmissionItemA.id },
    });
    expect(updatedFormSubmissionItem).toEqual({
      id: formSubmissionItemA.id,
      currentDecision: {
        id: expect.any(Number),
        decisionStatus: payload.decisionStatus,
        decisionBy: ministryAuditUser,
        decisionDate: now,
        createdAt: now,
        creator: ministryAuditUser,
        decisionNote: {
          id: expect.any(Number),
          description: payload.noteDescription,
          noteType: NoteType.StudentAppeal,
          createdAt: now,
          creator: ministryAuditUser,
        },
      },
      modifier: ministryAuditUser,
      updatedAt: now,
    });
  });

  it("Should submit an item decision, creating a history record when a decision is already in place and the user has approval authorization.", async () => {
    // Arrange
    const [yesterday, now] = [addDays(-1), new Date()];
    MockDate.set(now);
    // Create a form submission with an existing decision as if it was done yesterday,
    // then submit a new decision today and check that the previous decision is kept in
    // the history and the current decision is updated.
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      now: yesterday,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryAdminUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [{ decisionStatus: FormSubmissionDecisionStatus.Pending }],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const [previousDecision] = formSubmissionItemA.decisions;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const ministryAuditUser = { id: ministryAdminUser.id };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check the updated current decision of the form submission item
    // and the previous decision in the history.
    const updatedFormSubmissionItem = await db.formSubmissionItem.findOne({
      select: {
        id: true,
        currentDecision: {
          id: true,
          decisionStatus: true,
          decisionBy: { id: true },
          decisionDate: true,
          createdAt: true,
          creator: { id: true },
          decisionNote: {
            id: true,
            description: true,
            noteType: true,
            creator: { id: true },
          },
        },
        decisions: {
          id: true,
          decisionStatus: true,
          decisionBy: { id: true },
          decisionDate: true,
          createdAt: true,
          creator: { id: true },
          decisionNote: {
            id: true,
            description: true,
            noteType: true,
            creator: { id: true },
          },
        },
        modifier: { id: true },
        updatedAt: true,
      },
      relations: {
        currentDecision: {
          decisionBy: true,
          creator: true,
          decisionNote: { creator: true },
        },
        decisions: {
          decisionBy: true,
          creator: true,
          decisionNote: { creator: true },
        },
        modifier: true,
      },
      where: { id: formSubmissionItemA.id },
      order: {
        decisions: {
          id: "DESC",
        },
      },
      loadEagerRelations: false,
    });
    const currentDecisionExpected = {
      id: expect.any(Number),
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      decisionBy: ministryAuditUser,
      decisionDate: now,
      createdAt: now,
      creator: ministryAuditUser,
      decisionNote: {
        id: expect.any(Number),
        description: payload.noteDescription,
        noteType: NoteType.StudentForm,
        creator: ministryAuditUser,
      },
    };
    const previousDecisionExpected = {
      id: expect.any(Number),
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      decisionBy: ministryAuditUser,
      decisionDate: yesterday,
      createdAt: yesterday,
      creator: ministryAuditUser,
      decisionNote: {
        id: expect.any(Number),
        description: previousDecision.decisionNote.description,
        noteType: NoteType.StudentForm,
        creator: ministryAuditUser,
      },
    };
    expect(updatedFormSubmissionItem).toEqual({
      id: formSubmissionItemA.id,
      currentDecision: currentDecisionExpected,
      decisions: [currentDecisionExpected, previousDecisionExpected],
      modifier: ministryAuditUser,
      updatedAt: now,
    });
  });

  it("Should throw an unprocessable entity error when submitting an item decision for an application that was edited.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, null, {
      initialValues: { applicationStatus: ApplicationStatus.Edited },
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The application associated with the form submission is not in completed status.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when submitting an item decision for a completed form submission.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Completed,
      ministryAuditUser: ministryAdminUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Decisions cannot be made on items belonging to a form submission that is not pending.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a forbidden error when submitting a student form decision and the user is not authorized for the specific form category.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryAdminUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    await removeJWTUserRoles(appModule, [Role.StudentApproveDeclineForms]);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "User does not have the required role to perform this action.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should throw a forbidden error when submitting a student appeal decision and the user is not authorized for the specific form category.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryAdminUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    await removeJWTUserRoles(appModule, [Role.StudentApproveDeclineAppeals]);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "User does not have the required role to perform this action.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should throw a forbidden error when submitting a form decision and the user is not authorized to access the endpoint.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryAdminUser,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealA,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: formSubmissionItemA.updatedAt,
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should throw an unprocessable entity error when submitting an item decision and last updated date is different.", async () => {
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
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: new Date(),
    };
    const endpoint = `/aest/form-submission/items/${formSubmissionItemA.id}/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The form submission item has been updated since it was last retrieved. Please refresh and try again.",
        errorType: FORM_SUBMISSION_ITEM_OUTDATED,
      });
  });

  it("Should throw a not found error when submitting an item decision and the item does not exist.", async () => {
    // Arrange
    const payload = {
      decisionStatus: FormSubmissionDecisionStatus.Pending,
      noteDescription: "This is a decision note.",
      lastUpdateDate: new Date(),
    };
    const endpoint = `/aest/form-submission/items/99999/decision`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Form submission item with ID 99999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
