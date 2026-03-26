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
} from "@sims/test-utils";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";

describe("FormSubmissionInstitutionsController(e2e)-getFormSubmission", () => {
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

  it("Should get a form submission as pending and its decisions as pending when the final decision is not yet made and there is an approved and a pending decision (no decision set).", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Pending,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [
        {
          // Should be Pending as the final decision was not yet made.
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
          // Should be pending as it has no decision.
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
          decisions: [],
        },
      ],
    });
    const [formSubmissionItemA, formSubmissionItemB] =
      formSubmission.formSubmissionItems;
    const endpoint = `/institutions/form-submission/student/${formSubmission.student.id}/form-submission/${formSubmission.id}`;
    const studentToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          id: formSubmission.id,
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Pending,
          submittedDate: formSubmission.submittedDate.toISOString(),
          assessedDate: null,
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: formConfigs.studentAppealApplicationA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationA.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
            {
              id: formSubmissionItemB.id,
              formType: formConfigs.studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationB.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Pending,
              },
            },
          ],
        }),
      );
  });

  it("Should get a form submission as completed and its decision statuses, including the decision notes, when form submission is completed.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
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
          dynamicFormConfiguration: formConfigs.studentAppealApplicationB,
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
    const [itemADecision1] = formSubmissionItemA.decisions;
    const [itemBDecision1] = formSubmissionItemB.decisions;
    const endpoint = `/institutions/form-submission/student/${formSubmission.student.id}/form-submission/${formSubmission.id}`;
    const studentToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          id: formSubmission.id,
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          formCategory: FormCategory.StudentAppeal,
          status: FormSubmissionStatus.Completed,
          submittedDate: formSubmission.submittedDate.toISOString(),
          assessedDate: formSubmission.assessedDate.toISOString(),
          submissionItems: [
            {
              id: formSubmissionItemA.id,
              formType: formConfigs.studentAppealApplicationA.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationA.id,
              submissionData: formSubmissionItemA.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationA.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Approved,
                decisionNoteDescription:
                  itemADecision1.decisionNote.description,
              },
            },
            {
              id: formSubmissionItemB.id,
              formType: formConfigs.studentAppealApplicationB.formType,
              formCategory: FormCategory.StudentAppeal,
              dynamicFormConfigurationId:
                formConfigs.studentAppealApplicationB.id,
              submissionData: formSubmissionItemB.submittedData,
              formDefinitionName:
                formConfigs.studentAppealApplicationB.formDefinitionName,
              currentDecision: {
                decisionStatus: FormSubmissionDecisionStatus.Declined,
                decisionNoteDescription:
                  itemBDecision1.decisionNote.description,
              },
            },
          ],
        }),
      );
  });

  it("Should throw a not found exception when the form submission ID exists for the student but the user does not have access to the location.", async () => {
    // Arrange
    const collegeFAlternativeLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    const application = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFAlternativeLocation,
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      application,
      formCategory: FormCategory.StudentAppeal,
      submissionStatus: FormSubmissionStatus.Completed,
      ministryAuditUser: ministryUser,
      formSubmissionItems: [],
    });
    const endpoint = `/institutions/form-submission/student/${formSubmission.student.id}/form-submission/${formSubmission.id}`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeFUser);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: `Form submission with ID ${formSubmission.id} not found.`,
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
