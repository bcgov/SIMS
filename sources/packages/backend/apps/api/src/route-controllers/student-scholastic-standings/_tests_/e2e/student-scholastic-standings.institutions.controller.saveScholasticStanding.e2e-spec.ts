import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeStudentAppeal,
  getProviderInstanceForModule,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  InstitutionLocation,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import {
  APPLICATION_NOT_FOUND,
  FormNames,
  FormService,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../../../../services";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../../../constants";
import { ScholasticStandingAPIInDTO } from "../../models/student-scholastic-standings.dto";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { TestingModule } from "@nestjs/testing";

describe("StudentScholasticStandingsInstitutionsController(e2e)-saveScholasticStanding.", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let institutionUserToken: string;
  const SCHOLASTIC_STANDING_FORM_NAME =
    FormNames.ReportScholasticStandingChange;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // Institution token.
    institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
  });

  it("Should throw bad request exception error when the payload is invalid for formIO dryRun test.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    const payload = {
      data: {
        booksAndSupplies: 1000,
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.ChangeInIntensity,
      },
    };
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: false,
      formName: SCHOLASTIC_STANDING_FORM_NAME,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Invalid submission.",
        error: "Bad Request",
      });
  });

  it("Should throw unprocessable entity exception error when the application is not found.", async () => {
    // Arrange
    const payload: ScholasticStandingAPIInDTO = {
      data: {
        booksAndSupplies: 1000,
        dateOfChange: getISODateOnlyString(new Date()),
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.ChangeInIntensity,
      },
    };
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: SCHOLASTIC_STANDING_FORM_NAME,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/0000`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Application Not found or invalid current assessment or offering.",
        errorType: APPLICATION_NOT_FOUND,
      });
  });

  it("Should throw unprocessable entity exception error when the application is not found.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    application.isArchived = true;
    await db.application.save(application);
    const payload: ScholasticStandingAPIInDTO = {
      data: {
        booksAndSupplies: 1000,
        dateOfChange: getISODateOnlyString(new Date()),
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.ChangeInIntensity,
      },
    };
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: SCHOLASTIC_STANDING_FORM_NAME,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "This application is no longer eligible to request changes.",
        errorType: APPLICATION_CHANGE_NOT_ELIGIBLE,
      });
  });

  it("Should throw unprocessable entity exception error when the application status is not complete.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institutionLocation: collegeFLocation,
    });
    application.applicationStatus = ApplicationStatus.InProgress;
    await db.application.save(application);
    const payload: ScholasticStandingAPIInDTO = {
      data: {
        booksAndSupplies: 1000,
        dateOfChange: getISODateOnlyString(new Date()),
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.ChangeInIntensity,
      },
    };
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: SCHOLASTIC_STANDING_FORM_NAME,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Cannot report a change for application with status other than completed.",
        errorType: INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      });
  });

  it("Should create a new scholastic standing when the institution user requests it.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
        currentAssessmentInitialValues: {
          assessmentWorkflowId: "some fake id",
          assessmentDate: addDays(1),
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    // Createa student appeal for the application and its student assessment
    const studentAppeal = await createFakeStudentAppeal({
      application: application,
      studentAssessment: application.currentAssessment,
    });
    application.currentAssessment.studentAppeal = studentAppeal;
    await db.application.save(application);
    const payload: ScholasticStandingAPIInDTO = {
      data: {
        booksAndSupplies: 1000,
        dateOfChange: getISODateOnlyString(new Date()),
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.ChangeInIntensity,
      },
    };
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: SCHOLASTIC_STANDING_FORM_NAME,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    let createdScholasticStanding: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        console.log("response.body: ", response.body);
        expect(response.body.id).toBeGreaterThan(0);
        createdScholasticStanding = +response.body.id;
      });
    const newScholasticStanding = await db.studentScholasticStanding.findOne({
      select: {
        id: true,
        application: { id: true },
        studentAssessment: {
          id: true,
          triggerType: true,
          studentAppeal: { id: true },
        },
      },
      relations: {
        application: true,
        studentAssessment: { studentAppeal: true },
      },
      where: { id: createdScholasticStanding },
    });
    expect(newScholasticStanding.application.id).toBe(application.id);
    expect(newScholasticStanding.studentAssessment.triggerType).toBe(
      AssessmentTriggerType.ScholasticStandingChange,
    );
    expect(newScholasticStanding.studentAssessment.studentAppeal.id).toBe(
      studentAppeal.id,
    );
  });
});
