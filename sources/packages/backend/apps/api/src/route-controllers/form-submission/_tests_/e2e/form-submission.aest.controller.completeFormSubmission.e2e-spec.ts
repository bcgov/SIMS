import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
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
  ApplicationStatus,
  AssessmentTriggerType,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  ModifiedIndependentStatus,
  NotificationMessageType,
  User,
} from "@sims/sims-db";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
  getEntitiesForMinistryCompleteFormSubmissionAssertion,
} from "./form-submission-utils";
import MockDate from "mockdate";
import { getPSTPDTDateTime } from "@sims/utilities";
import { FORM_SUBMISSION_ITEM_OUTDATED } from "../../../../services";

describe("FormSubmissionAESTController(e2e)-completeFormSubmission", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryAdminUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
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

  it("Should complete a student appeal, create an appeal assessment, and generate a notification when all items have decisions and the user has approval authorization.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const application = await saveFakeApplication(db.dataSource, null, {
      initialValues: { applicationStatus: ApplicationStatus.Completed },
    });
    const student = application.student;
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      now,
      application,
      ministryAuditUser: ministryAdminUser,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          submittedData: {
            actions: [FormSubmissionActionType.CreateStudentAppealAssessment],
          },
          decisions: [
            { decisionStatus: FormSubmissionDecisionStatus.Approved },
          ],
        },
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
          decisions: [
            { decisionStatus: FormSubmissionDecisionStatus.Approved },
          ],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const payload = {
      items: [
        {
          submissionItemId: formSubmissionItemA.id,
          lastUpdateDate: formSubmissionItemA.updatedAt,
        },
        {
          submissionItemId: formSubmissionItemB.id,
          lastUpdateDate: formSubmissionItemB.updatedAt,
        },
      ],
    };
    const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const ministryAuditUser = { id: ministryAdminUser.id };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Validate database changes.
    const [updatedFormSubmission, notification] =
      await getEntitiesForMinistryCompleteFormSubmissionAssertion(
        db,
        formSubmission.id,
        student.user.id,
      );
    // Validate form submission data is updated correctly.
    expect(updatedFormSubmission).toEqual({
      id: formSubmission.id,
      submissionStatus: FormSubmissionStatus.Completed,
      assessedDate: now,
      assessedBy: ministryAuditUser,
      modifier: ministryAuditUser,
      updatedAt: now,
      student: {
        id: student.id,
        notes: [
          {
            id: formSubmissionItemA.currentDecision.decisionNote.id,
          },
          {
            id: formSubmissionItemB.currentDecision.decisionNote.id,
          },
        ],
      },
    });
    // Validate notification.
    expect(notification).toEqual({
      id: expect.any(Number),
      notificationMessage: {
        id: NotificationMessageType.StudentFormCompleted,
      },
      creator: ministryAuditUser,
      messagePayload: {
        email_address: student.user.email,
        template_id: "fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b",
        personalisation: {
          givenNames: student.user.firstName,
          lastName: student.user.lastName,
          date: `${getPSTPDTDateTime(now)} PST/PDT`,
        },
      },
    });
    // Validate target action for the form submission.
    const updatedApplication = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
          formSubmission: { id: true },
        },
      },
      relations: {
        currentAssessment: { formSubmission: true },
      },
      where: { id: application.id },
    });
    expect(updatedApplication).toEqual({
      id: application.id,
      currentAssessment: {
        id: expect.any(Number),
        triggerType: AssessmentTriggerType.StudentAppeal,
        formSubmission: { id: formSubmission.id },
      },
    });
  });

  [
    {
      submissionStatus: FormSubmissionStatus.Completed,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      modifiedIndependentStatus: ModifiedIndependentStatus.Approved,
    },
    {
      submissionStatus: FormSubmissionStatus.Declined,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      modifiedIndependentStatus: ModifiedIndependentStatus.Declined,
    },
  ].forEach(
    ({ submissionStatus, decisionStatus, modifiedIndependentStatus }) => {
      it(`Should complete a student form submission, update the modified independent status to ${modifiedIndependentStatus}, and generate a notification when the user completes the form submission and the user has approval authorization.`, async () => {
        // Arrange
        const now = new Date();
        MockDate.set(now);
        const application = await saveFakeApplication(db.dataSource, null, {
          initialValues: { applicationStatus: ApplicationStatus.Completed },
        });
        const student = application.student;
        const formSubmission = await saveFakeFormSubmissionFromInputTestData(
          db,
          {
            now,
            application,
            ministryAuditUser: ministryAdminUser,
            formCategory: FormCategory.StudentAppeal,
            submissionStatus: FormSubmissionStatus.Pending,
            formSubmissionItems: [
              {
                dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
                submittedData: {
                  actions: [FormSubmissionActionType.UpdateModifiedIndependent],
                },
                decisions: [{ decisionStatus }],
              },
            ],
          },
        );
        const [formSubmissionItemA] = formSubmission.formSubmissionItems;
        const payload = {
          items: [
            {
              submissionItemId: formSubmissionItemA.id,
              lastUpdateDate: formSubmissionItemA.updatedAt,
            },
          ],
        };
        const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
        const token = await getAESTToken(AESTGroups.BusinessAdministrators);
        const ministryAuditUser = { id: ministryAdminUser.id };

        // Act/Assert
        await request(app.getHttpServer())
          .patch(endpoint)
          .send(payload)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK);
        // Validate database changes.
        const [updatedFormSubmission, notification] =
          await getEntitiesForMinistryCompleteFormSubmissionAssertion(
            db,
            formSubmission.id,
            student.user.id,
          );
        // Validate form submission data is updated correctly.
        expect(updatedFormSubmission).toEqual({
          id: formSubmission.id,
          submissionStatus,
          assessedDate: now,
          assessedBy: ministryAuditUser,
          modifier: ministryAuditUser,
          updatedAt: now,
          student: {
            id: student.id,
            notes: [
              {
                id: formSubmissionItemA.currentDecision.decisionNote.id,
              },
            ],
          },
        });
        // Validate notification.
        expect(notification).toEqual({
          id: expect.any(Number),
          notificationMessage: {
            id: NotificationMessageType.StudentFormCompleted,
          },
          creator: ministryAuditUser,
          messagePayload: {
            email_address: student.user.email,
            template_id: "fed6b26e-d1f2-4a8c-bfe5-5cb66c00458b",
            personalisation: {
              givenNames: student.user.firstName,
              lastName: student.user.lastName,
              date: `${getPSTPDTDateTime(now)} PST/PDT`,
            },
          },
        });
        // Validate target action for the form submission.
        const updatedStudent = await db.student.findOne({
          select: {
            id: true,
            modifiedIndependentStatus: true,
            modifiedIndependentStatusUpdatedBy: { id: true },
            modifiedIndependentStatusUpdatedOn: true,
            modifiedIndependentFormSubmissionItem: { id: true },
          },
          relations: {
            modifiedIndependentStatusUpdatedBy: true,
            modifiedIndependentFormSubmissionItem: true,
          },
          where: { id: student.id },
          loadEagerRelations: false,
        });
        // Modified independent status should be updated to Approved
        // with reference to the form submission item and the user who made the update
        // when the request was approved by the Ministry.
        expect(updatedStudent).toEqual({
          id: student.id,
          modifiedIndependentStatus,
          modifiedIndependentStatusUpdatedBy: ministryAuditUser,
          modifiedIndependentStatusUpdatedOn: now,
          modifiedIndependentFormSubmissionItem: { id: formSubmissionItemA.id },
        });
      });
    },
  );

  it("Should throw an unprocessable entity error when attempting to complete a student appeal but some items were updated.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, null, {
      initialValues: { applicationStatus: ApplicationStatus.Completed },
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      ministryAuditUser: ministryAdminUser,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [
            { decisionStatus: FormSubmissionDecisionStatus.Approved },
          ],
        },
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
          decisions: [
            { decisionStatus: FormSubmissionDecisionStatus.Approved },
          ],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const payload = {
      items: [
        {
          submissionItemId: formSubmissionItemA.id,
          lastUpdateDate: formSubmissionItemA.updatedAt,
        },
        {
          submissionItemId: formSubmissionItemB.id,
          // Force the submission item to be outdated by setting a past date in the payload.
          lastUpdateDate: new Date(),
        },
      ],
    };
    const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Form submission item with ID ${formSubmissionItemB.id} has been updated since it was last retrieved. Please refresh and try again.`,
        errorType: FORM_SUBMISSION_ITEM_OUTDATED,
      });
  });

  it("Should throw an unprocessable entity error when attempting to complete a student appeal but the application was edited.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, null, {
      initialValues: { applicationStatus: ApplicationStatus.Edited },
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      ministryAuditUser: ministryAdminUser,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentAppealApplicationA,
          decisions: [
            { decisionStatus: FormSubmissionDecisionStatus.Approved },
          ],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      items: [
        {
          submissionItemId: formSubmissionItemA.id,
          lastUpdateDate: formSubmissionItemA.updatedAt,
        },
      ],
    };
    const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
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

  it("Should throw an unprocessable entity error when attempting to complete a student form but an item decision is pending.", async () => {
    // Arrange
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      ministryAuditUser: ministryAdminUser,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [{ decisionStatus: FormSubmissionDecisionStatus.Pending }],
        },
      ],
    });
    const [formSubmissionItemA] = formSubmission.formSubmissionItems;
    const payload = {
      items: [
        {
          submissionItemId: formSubmissionItemA.id,
          lastUpdateDate: formSubmissionItemA.updatedAt,
        },
      ],
    };
    const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Final decision cannot be made when some decisions are still pending.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
