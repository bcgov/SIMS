import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeStudentAppeal,
  getProviderInstanceForModule,
  saveFakeApplication,
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
  NotificationMessageType,
  OfferingIntensity,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import {
  APPLICATION_NOT_FOUND,
  FormNames,
  FormService,
} from "../../../../services";
import {
  ScholasticStandingAPIInDTO,
  ScholasticStandingData,
} from "../../models/student-scholastic-standings.dto";
import { addToDateOnlyString, getISODateOnlyString } from "@sims/utilities";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { TestingModule } from "@nestjs/testing";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../../../constants";

describe("StudentScholasticStandingsInstitutionsController(e2e)-saveScholasticStanding.", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let formService: FormService;
  let payload: ScholasticStandingAPIInDTO;

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
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    formService = await getProviderInstanceForModule(
      appModule,
      AppInstitutionsModule,
      FormService,
    );
  });

  beforeEach(async () => {
    mockFormioDryRun();
  });

  it("Should throw bad request exception error when the payload is invalid for formIO dryRun test.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const invalidPayload = {
      data: {
        booksAndSupplies: 1000,
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.SchoolTransfer,
      },
    };
    mockFormioDryRun({ validDryRun: false });
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(invalidPayload)
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
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/0000`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Application Not found or invalid current assessment or offering or application status.",
        errorType: APPLICATION_NOT_FOUND,
      });
  });

  it("Should throw unprocessable entity exception error when the application change is Archived.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { applicationStatus: ApplicationStatus.Completed, isArchived: true },
    );

    await db.application.save(application);
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

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
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { applicationStatus: ApplicationStatus.InProgress },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Application Not found or invalid current assessment or offering or application status.",
        errorType: APPLICATION_NOT_FOUND,
      });
  });

  it("Should create a new scholastic standing when the institution user requests it and keep the existent student appeal.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Create a student appeal for the application and its student assessment.
    const studentAppeal = createFakeStudentAppeal({
      application: application,
      studentAssessment: application.currentAssessment,
    });
    application.currentAssessment.studentAppeal = studentAppeal;
    await db.application.save(application);
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    let createdScholasticStandingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdScholasticStandingId = +response.body.id;
      });
    const queryApplication = await db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
          studentScholasticStanding: { id: true },
          studentAppeal: { id: true },
        },
      },
      relations: {
        currentAssessment: {
          studentScholasticStanding: true,
          studentAppeal: true,
        },
      },
      where: { id: application.id },
    });
    expect(queryApplication.currentAssessment.id).not.toBe(
      application.currentAssessment.id,
    );
    expect(queryApplication.currentAssessment.triggerType).toBe(
      AssessmentTriggerType.ScholasticStandingChange,
    );
    expect(queryApplication.currentAssessment.studentAppeal.id).toBe(
      studentAppeal.id,
    );
    expect(
      queryApplication.currentAssessment.studentScholasticStanding.id,
    ).toBe(createdScholasticStandingId);
  });

  it("Should create a new scholastic standing 'School transfer' for a part-time application when the institution user requests.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    mockFormioDryRun({
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.SchoolTransfer,
      dateOfChange: application.currentAssessment.offering.studyStartDate,
    });

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    let createdScholasticStandingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        createdScholasticStandingId = +response.body.id;
        expect(response.body.id).toBeGreaterThan(0);
      });

    const studentScholasticStanding = await db.studentScholasticStanding.exists(
      {
        select: {
          id: true,
        },
        relations: {
          application: true,
        },
        where: {
          id: createdScholasticStandingId,
          application: { id: application.id },
        },
      },
    );

    expect(studentScholasticStanding).toBe(true);

    const notifications = await db.notification.find({
      select: {
        id: true,
        user: { id: true },
        notificationMessage: { id: true },
      },
      relations: { user: true, notificationMessage: true },
      where: { user: { id: application.student.user.id } },
      order: { notificationMessage: { id: "ASC" } },
    });
    expect(notifications).toEqual([
      {
        id: expect.any(Number),
        notificationMessage: {
          id: NotificationMessageType.InstitutionReportsChange,
        },
        user: { id: application.student.user.id },
      },
    ]);
  });

  it("Should create a new scholastic standing 'Student withdrew from program' for a part-time application when the institution user requests.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    mockFormioDryRun({
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      dateOfWithdrawal: application.currentAssessment.offering.studyStartDate,
    });

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    let createdScholasticStandingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdScholasticStandingId = +response.body.id;
      });

    const studentScholasticStanding = await db.studentScholasticStanding.exists(
      {
        select: {
          id: true,
        },
        relations: {
          application: true,
        },
        where: {
          id: createdScholasticStandingId,
          application: { id: application.id },
        },
      },
    );

    expect(studentScholasticStanding).toBe(true);

    const restriction = await db.studentRestriction.find({
      select: {
        id: true,
        restriction: {
          id: true,
          restrictionCode: true,
        },
      },
      relations: {
        restriction: true,
      },
      where: { application: { id: application.id } },
    });
    expect(restriction).toEqual([
      {
        id: expect.any(Number),
        restriction: {
          id: expect.any(Number),
          restrictionCode: RestrictionCode.PTSSR,
        },
      },
      {
        id: expect.any(Number),
        restriction: {
          id: expect.any(Number),
          restrictionCode: RestrictionCode.PTWTHD,
        },
      },
    ]);
    const notifications = await db.notification.find({
      select: {
        id: true,
        user: { id: true },
        notificationMessage: { id: true },
      },
      relations: { user: true, notificationMessage: true },
      where: { user: { id: application.student.user.id } },
      order: { notificationMessage: { id: "ASC" } },
    });
    expect(notifications).toEqual([
      {
        id: expect.any(Number),
        notificationMessage: {
          id: NotificationMessageType.StudentRestrictionAdded,
        },
        user: { id: application.student.user.id },
      },
      {
        id: expect.any(Number),
        notificationMessage: {
          id: NotificationMessageType.InstitutionReportsChange,
        },
        user: { id: application.student.user.id },
      },
    ]);
  });

  it("Should create a new scholastic standing 'Student completed program early' for a part-time application when the institution user requests.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    mockFormioDryRun({
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentCompletedProgramEarly,
      dateOfCompletion: application.currentAssessment.offering.studyStartDate,
    });

    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    // Act/Assert
    let createdScholasticStandingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdScholasticStandingId = +response.body.id;
      });

    const studentScholasticStanding = await db.studentScholasticStanding.exists(
      {
        select: {
          id: true,
        },
        relations: {
          application: true,
        },
        where: {
          id: createdScholasticStandingId,
          application: { id: application.id },
        },
      },
    );

    expect(studentScholasticStanding).toBe(true);

    const notifications = await db.notification.find({
      select: {
        id: true,
        user: { id: true },
        notificationMessage: { id: true },
      },
      relations: { user: true, notificationMessage: true },
      where: { user: { id: application.student.user.id } },
      order: { notificationMessage: { id: "ASC" } },
    });
    expect(notifications).toEqual([
      {
        id: expect.any(Number),
        notificationMessage: {
          id: NotificationMessageType.InstitutionReportsChange,
        },
        user: { id: application.student.user.id },
      },
    ]);
  });

  it("Should not create new scholastic standing 'School transfer' for a part-time application when date of change is not between study start date and end date.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;

    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.SchoolTransfer,
      dateOfChange: addToDateOnlyString(
        application.currentAssessment.offering.studyStartDate,
        1,
        "day",
      ),
    });
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

  it("Should not create new scholastic standing 'Student withdrew from program' for a part-time application when date of withdrawal is not between study start date and end date.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      dateOfWithdrawal: addToDateOnlyString(
        application.currentAssessment.offering.studyStartDate,
        1,
        "day",
      ),
    });
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

  it("Should not create new scholastic standing 'Student completed program early' for a part-time application when date of withdrawal is not between study start date and end date.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentCompletedProgramEarly,
      dateOfCompletion: addToDateOnlyString(
        application.currentAssessment.offering.studyStartDate,
        1,
        "day",
      ),
    });
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

  it("Should not create new scholastic standing 'School transfer' for a part-time application when date of change is greater than current date.", async () => {
    // Arrange
    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.SchoolTransfer,
      dateOfChange: addToDateOnlyString(new Date(), 1, "day"),
    });
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
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

  it("Should not create new scholastic standing 'Student withdrew from program' for a part-time application when date of withdrawal is greater than current date.", async () => {
    // Arrange
    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      dateOfWithdrawal: addToDateOnlyString(new Date(), 1, "day"),
    });
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
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

  it("Should not create new scholastic standing 'Student completed program early' for a part-time application when date of withdrawal is greater than current date.", async () => {
    // Arrange
    mockFormioDryRun({
      validDryRun: false,
      studentScholasticStandingChangeType:
        StudentScholasticStandingChangeType.StudentCompletedProgramEarly,
      dateOfCompletion: addToDateOnlyString(new Date(), 1, "day"),
    });
    const application = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
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

  /**
   * Centralized method to handle the form.io mock.
   * @param options method options:
   * - `validDryRun`: boolean false indicates that the form mock resolved value is invalid. Default value is true.
   * - `studentScholasticStandingChangeType`: Student scholastic standing change type to be added in combination with SchoolTransfer scholastic standing type .
   * - `dateOfChange`: Date of change used during the School Transfer scholastic standing.
   * - `dateOfCompletion`: Date of change used during the Student completed program early scholastic standing.
   * - `dateOfWithdrawal`: Date of change used during the Student withdrew from program scholastic standing.
   */
  function mockFormioDryRun(options?: {
    validDryRun?: boolean;
    studentScholasticStandingChangeType?: StudentScholasticStandingChangeType;
    dateOfChange?: string;
    dateOfCompletion?: string;
    dateOfWithdrawal?: string;
  }): void {
    const validDryRun = options?.validDryRun ?? true;

    payload = {
      data: {
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.SchoolTransfer,
        studyEndDate: getISODateOnlyString(new Date()),
        studyStartDate: getISODateOnlyString(new Date()),
      } as ScholasticStandingData,
    };

    switch (options?.studentScholasticStandingChangeType) {
      case StudentScholasticStandingChangeType.StudentCompletedProgramEarly:
        payload.data.scholasticStandingChangeType =
          options?.studentScholasticStandingChangeType;
        payload.data.dateOfCompletion =
          options?.dateOfCompletion ?? getISODateOnlyString(new Date());
        break;
      case StudentScholasticStandingChangeType.StudentWithdrewFromProgram:
        payload.data.scholasticStandingChangeType =
          options?.studentScholasticStandingChangeType;
        payload.data.dateOfWithdrawal =
          options?.dateOfWithdrawal ?? getISODateOnlyString(new Date());
        break;
      case StudentScholasticStandingChangeType.SchoolTransfer:
        payload.data.scholasticStandingChangeType =
          options?.studentScholasticStandingChangeType;
        payload.data.dateOfChange =
          options?.dateOfChange ?? getISODateOnlyString(new Date());
        break;
    }

    formService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: validDryRun,
      formName: FormNames.ReportScholasticStandingChange,
      data: { data: payload.data },
    });
  }
});
