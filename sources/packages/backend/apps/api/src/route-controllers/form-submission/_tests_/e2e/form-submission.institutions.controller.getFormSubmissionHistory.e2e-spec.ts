import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTUser,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  FormCategory,
  FormSubmissionCancellationReason,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";

describe("FormSubmissionInstitutionsController(e2e)-getFormSubmissionHistory", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let ministryUser: User;
  let formConfigs: DynamicConfigurationTestData;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    // College F.
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    formConfigs = await createFakeFormConfigurations(app, db);
  });

  it("Should get the form submission history including student appeals and student forms for the locations the user has access to when there are student appeals and forms previously submitted.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const authorizedApplication = await saveFakeApplication(db.dataSource, {
      student,
      institutionLocation: collegeFLocation,
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
        application: authorizedApplication,
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
            dynamicFormConfiguration: formConfigs.studentAppealA,
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
    const collegeFAlternativeLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    const nonAuthorizedApplication = await saveFakeApplication(db.dataSource, {
      student,
      institutionLocation: collegeFAlternativeLocation,
    });
    // Completed student appeal, application associated to a location the user does not have access.
    // Expected to NOT be returned.
    const nonAuthorizedCompletedStudentAppealPromise =
      saveFakeFormSubmissionFromInputTestData(db, {
        application: nonAuthorizedApplication,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Completed,
        ministryAuditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
              },
            ],
          },
        ],
      });
    const [pendingStudentAppeal, completedStudentAppeal, completedStudentForm] =
      await Promise.all([
        pendingStudentAppealPromise,
        completedStudentAppealPromise,
        completedStudentFormPromise,
        nonAuthorizedCompletedStudentAppealPromise,
      ]);
    const [pendingStudentAppealSavedItem1, pendingStudentAppealSavedItem2] =
      pendingStudentAppeal.formSubmissionItems;
    const [completedStudentAppealSavedItem1] =
      completedStudentAppeal.formSubmissionItems;
    const [completedStudentFormSavedItem1] =
      completedStudentForm.formSubmissionItems;
    const endpoint = `/institutions/form-submission/student/${student.id}`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.submissions).toEqual([
          // Pending Student Appeal
          {
            id: pendingStudentAppeal.id,
            applicationId: authorizedApplication.id,
            applicationNumber: authorizedApplication.applicationNumber,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Pending,
            submittedDate: pendingStudentAppeal.submittedDate.toISOString(),
            assessedDate: null,
            canCancelSubmission: false,
            cancellationReason: null,
            statusUpdatedDate:
              pendingStudentAppeal.submissionStatusUpdatedOn.toISOString(),
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
            canCancelSubmission: false,
            cancellationReason: null,
            statusUpdatedDate:
              completedStudentAppeal.submissionStatusUpdatedOn.toISOString(),
            submissionItems: [
              {
                id: completedStudentAppealSavedItem1.id,
                formType: formConfigs.studentAppealA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId: formConfigs.studentAppealA.id,
                formDefinitionName:
                  formConfigs.studentAppealA.formDefinitionName,
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
            canCancelSubmission: false,
            cancellationReason: null,
            statusUpdatedDate:
              completedStudentForm.submissionStatusUpdatedOn.toISOString(),
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

  it("Should get the form submission with emulated decision status null for the submission item(s) when the form submission is cancelled without being assessed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const authorizedApplication = await saveFakeApplication(db.dataSource, {
      student,
      institutionLocation: collegeFLocation,
    });

    // Form submission that is cancelled without being assessed, with an associated application.
    const cancelledWithoutAssessedAppeal =
      await saveFakeFormSubmissionFromInputTestData(db, {
        now: new Date(),
        application: authorizedApplication,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Cancelled,
        ministryAuditUser: ministryUser,
        // Ensure items are added in alphabetical order DESC to
        // assert they will be returned in alphabetical order ASC.
        formSubmissionItems: [
          {
            // API is expected to return null for the decision status as it was not assessed but cancelled.
            dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
              },
            ],
          },
        ],
      });
    const [cancelledWithoutAssessedAppealSavedItem] =
      cancelledWithoutAssessedAppeal.formSubmissionItems;
    const endpoint = `/institutions/form-submission/student/${student.id}`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.submissions).toEqual([
          {
            id: cancelledWithoutAssessedAppeal.id,
            applicationId: authorizedApplication.id,
            applicationNumber: authorizedApplication.applicationNumber,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Cancelled,
            submittedDate:
              cancelledWithoutAssessedAppeal.submittedDate.toISOString(),
            assessedDate: null,
            canCancelSubmission: false,
            cancellationReason:
              FormSubmissionCancellationReason.StudentCancelledSubmission,
            statusUpdatedDate:
              cancelledWithoutAssessedAppeal.submissionStatusUpdatedOn.toISOString(),
            submissionItems: [
              {
                id: cancelledWithoutAssessedAppealSavedItem.id,
                formType: formConfigs.studentAppealApplicationB.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId:
                  formConfigs.studentAppealApplicationB.id,
                formDefinitionName:
                  formConfigs.studentAppealApplicationB.formDefinitionName,
                currentDecision: {
                  decisionStatus: null,
                },
              },
            ],
          },
        ]),
      );
  });

  it("Should get the form submission with actual decision status when the form submission is cancelled after being assessed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const authorizedApplication = await saveFakeApplication(db.dataSource, {
      student,
      institutionLocation: collegeFLocation,
    });
    // Form submission that is cancelled after being assessed, with an associated application.
    const cancelledAfterAssessedAppeal =
      await saveFakeFormSubmissionFromInputTestData(db, {
        now: new Date(),
        student,
        application: authorizedApplication,
        formCategory: FormCategory.StudentAppeal,
        submissionStatus: FormSubmissionStatus.Cancelled,
        ministryAuditUser: ministryUser,
        isAssessed: true,
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
    const [cancelledAfterAssessedAppealSavedItem] =
      cancelledAfterAssessedAppeal.formSubmissionItems;
    const endpoint = `/institutions/form-submission/student/${student.id}`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body.submissions).toEqual([
          {
            id: cancelledAfterAssessedAppeal.id,
            applicationId: authorizedApplication.id,
            applicationNumber: authorizedApplication.applicationNumber,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Cancelled,
            submittedDate:
              cancelledAfterAssessedAppeal.submittedDate.toISOString(),
            assessedDate:
              cancelledAfterAssessedAppeal.assessedDate.toISOString(),
            canCancelSubmission: false,
            cancellationReason:
              FormSubmissionCancellationReason.StudentCancelledSubmission,
            statusUpdatedDate:
              cancelledAfterAssessedAppeal.submissionStatusUpdatedOn.toISOString(),
            submissionItems: [
              {
                id: cancelledAfterAssessedAppealSavedItem.id,
                formType: formConfigs.studentAppealApplicationA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId:
                  formConfigs.studentAppealApplicationA.id,
                formDefinitionName:
                  formConfigs.studentAppealApplicationA.formDefinitionName,
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
