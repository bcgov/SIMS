import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";
import { createFakeFormConfigurations } from "./form-submission-utils";

describe("FormSubmissionInstitutionsController(e2e)-getFormSubmissionHistory", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let ministryUser: User;
  let studentAppealApplicationA: DynamicFormConfiguration;
  let studentAppealApplicationB: DynamicFormConfiguration;
  let studentFormA: DynamicFormConfiguration;

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
    [studentAppealApplicationA, studentAppealApplicationB, studentFormA] =
      await createFakeFormConfigurations(db);
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
        auditUser: ministryUser,
        // Ensure items are added in alphabetical oder DESC to
        // assert they will be returned in alphabetical oder ASC.
        formSubmissionItems: [
          {
            // Should be pending as it has no decision.
            dynamicFormConfiguration: studentAppealApplicationB,
            decisions: [
              {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
              },
            ],
          },
          {
            // Create at least one form with decision history to ensure the data will not be returned.
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
        auditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: studentAppealApplicationA,
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
        auditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: studentFormA,
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
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Completed,
        auditUser: ministryUser,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: studentAppealApplicationB,
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
    const studentToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

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
            applicationId: authorizedApplication.id,
            applicationNumber: authorizedApplication.applicationNumber,
            formCategory: FormCategory.StudentAppeal,
            status: FormSubmissionStatus.Pending,
            submittedDate: pendingStudentAppeal.submittedDate.toISOString(),
            assessedDate: null,
            submissionItems: [
              {
                id: pendingStudentAppealSavedItem2.id,
                formType: studentAppealApplicationA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId: studentAppealApplicationA.id,
                formDefinitionName:
                  studentAppealApplicationA.formDefinitionName,
                currentDecision: {
                  decisionStatus: FormSubmissionDecisionStatus.Pending,
                },
              },
              {
                id: pendingStudentAppealSavedItem1.id,
                formType: studentAppealApplicationB.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId: studentAppealApplicationB.id,
                formDefinitionName:
                  studentAppealApplicationB.formDefinitionName,
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
                formType: studentAppealApplicationA.formType,
                formCategory: FormCategory.StudentAppeal,
                dynamicFormConfigurationId: studentAppealApplicationA.id,
                formDefinitionName:
                  studentAppealApplicationA.formDefinitionName,
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
                formType: studentFormA.formType,
                formCategory: FormCategory.StudentForm,
                dynamicFormConfigurationId: studentFormA.id,
                formDefinitionName: studentFormA.formDefinitionName,
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
