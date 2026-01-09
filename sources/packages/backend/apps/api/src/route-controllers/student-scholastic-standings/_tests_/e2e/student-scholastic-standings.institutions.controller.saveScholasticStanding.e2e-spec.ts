import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeSFASIndividual,
  createFakeStudentAppeal,
  createFakeStudentRestriction,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  getAuthorizedLocation,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  InstitutionLocation,
  NotificationMessageType,
  OfferingIntensity,
  OfferingTypes,
  Restriction,
  StudentRestriction,
  StudentScholasticStandingChangeType,
  StudyBreaksAndWeeks,
} from "@sims/sims-db";
import {
  APPLICATION_NOT_FOUND,
  FormNames,
  FormService,
} from "../../../../services";
import { ScholasticStandingAPIInDTO } from "../../models/student-scholastic-standings.dto";
import { addToDateOnlyString, getISODateOnlyString } from "@sims/utilities";
import { AppInstitutionsModule } from "../../../../app.institutions.module";
import { TestingModule } from "@nestjs/testing";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../../../constants";
import { InstitutionUserTypes } from "../../../../auth";
import { SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS } from "../../../../utilities";
import { In } from "typeorm";

describe("StudentScholasticStandingsInstitutionsController(e2e)-saveScholasticStanding.", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let formService: FormService;
  let payload: ScholasticStandingAPIInDTO;
  let ssrRestriction: Restriction;
  let ssrnRestriction: Restriction;
  let wthdRestriction: Restriction;

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
    // Find restriction used for validations.
    const restrictions = await db.restriction.find({
      select: {
        id: true,
        restrictionCode: true,
      },
      where: {
        restrictionCode: In([
          RestrictionCode.SSR,
          RestrictionCode.SSRN,
          RestrictionCode.WTHD,
        ]),
      },
    });
    ssrRestriction = restrictions.find(
      (restriction) => restriction.restrictionCode === RestrictionCode.SSR,
    );
    ssrnRestriction = restrictions.find(
      (restriction) => restriction.restrictionCode === RestrictionCode.SSRN,
    );
    wthdRestriction = restrictions.find(
      (restriction) => restriction.restrictionCode === RestrictionCode.WTHD,
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

  it("Should not create a new scholastic standing when the user is read-only.", async () => {
    // Arrange
    const collegeELocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeEReadOnlyUser,
      InstitutionUserTypes.readOnlyUser,
    );
    const endpoint = `/institutions/scholastic-standing/location/${collegeELocation.id}/application/99999`;
    const collegEInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(collegEInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
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

    const { user: collegeFUser } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    const existingOffering = application.currentAssessment.offering;

    // Assert that the related Scholastic Standing offering is created with the correct values
    const offering = await db.educationProgramOffering.findOne({
      select: {
        id: true,
        creator: {
          id: true,
        },
        educationProgram: {
          id: true,
        },
        institutionLocation: {
          id: true,
        },
        parentOffering: {
          id: true,
        },
        submittedBy: {
          id: true,
        },
        submittedDate: true,
        name: true,
        studyStartDate: true,
        studyEndDate: true,
        actualTuitionCosts: true,
        programRelatedCosts: true,
        mandatoryFees: true,
        exceptionalExpenses: true,
        offeringDelivered: true,
        lacksStudyBreaks: true,
        offeringType: true,
        offeringIntensity: true,
        yearOfStudy: true,
        hasOfferingWILComponent: true,
        studyBreaks: true,
        offeringDeclaration: true,
        offeringStatus: true,
        courseLoad: true,
        isAviationOffering: true,
      },
      relations: {
        creator: true,
        educationProgram: true,
        institutionLocation: true,
        parentOffering: true,
        submittedBy: true,
      },
      where: {
        offeringType: OfferingTypes.ScholasticStanding,
        parentOffering: { id: existingOffering.id },
      },
      order: { id: "DESC" },
    });
    expect(offering).toEqual({
      id: expect.any(Number),
      creator: {
        id: collegeFUser.id,
      },
      educationProgram: {
        id: existingOffering.educationProgram.id,
      },
      institutionLocation: {
        id: existingOffering.institutionLocation.id,
      },
      parentOffering: { id: existingOffering.parentOffering.id },
      submittedBy: {
        id: collegeFUser.id,
      },
      // TODO Discuss how to handle this better. Mock doesn't work as this is a DB default.
      submittedDate: expect.any(Date),
      name: existingOffering.name,
      studyStartDate: existingOffering.studyStartDate,
      studyEndDate: payload.data.dateOfWithdrawal,
      actualTuitionCosts: existingOffering.actualTuitionCosts,
      programRelatedCosts: existingOffering.programRelatedCosts,
      mandatoryFees: existingOffering.mandatoryFees,
      exceptionalExpenses: existingOffering.exceptionalExpenses,
      offeringDelivered: existingOffering.offeringDelivered,
      lacksStudyBreaks: existingOffering.lacksStudyBreaks,
      offeringType: OfferingTypes.ScholasticStanding,
      offeringIntensity: existingOffering.offeringIntensity,
      yearOfStudy: existingOffering.yearOfStudy,
      hasOfferingWILComponent: existingOffering.hasOfferingWILComponent,
      studyBreaks: {
        totalDays: 1,
        totalFundedWeeks: 1,
        fundedStudyPeriodDays: 1,
        unfundedStudyPeriodDays: 0,
      },
      offeringDeclaration: existingOffering.offeringDeclaration,
      offeringStatus: existingOffering.offeringStatus,
      courseLoad: existingOffering.courseLoad,
      isAviationOffering: existingOffering.isAviationOffering,
    });
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
        application.currentAssessment.offering.studyEndDate,
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
        application.currentAssessment.offering.studyEndDate,
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
        application.currentAssessment.offering.studyEndDate,
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

  it(
    "Should not create new scholastic standing 'Student did not complete program' for a part-time application " +
      "when number of unsuccessful completion weeks is greater than the total number of offering weeks.",
    async () => {
      // Arrange
      mockFormioDryRun({
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        numberOfUnsuccessfulWeeks: 50,
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
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message:
            "Number of unsuccessful weeks cannot exceed the number of offering weeks.",
          errorType: "INVALID_UNSUCCESSFUL_COMPLETION_WEEKS",
        });
    },
  );

  it(
    "Should create new scholastic standing 'Student did not complete program' for a part-time application " +
      "when number of unsuccessful completion weeks is less than the total number of offering weeks.",
    async () => {
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

      // Mock with a valid number of unsuccessful weeks (smaller than total offering weeks).
      mockFormioDryRun({
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        numberOfUnsuccessfulWeeks: 5,
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
          createdScholasticStandingId = response.body.id;
        });
      const { unsuccessfulWeeks } = await db.studentScholasticStanding.findOne({
        select: {
          id: true,
          unsuccessfulWeeks: true,
        },
        where: {
          id: createdScholasticStandingId,
          application: { id: application.id },
        },
      });
      expect(unsuccessfulWeeks).toBe(5);
    },
  );

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

  // Part-time related student restrictions.
  describe(`Part-time restrictions for '${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram}'.`, () => {
    it(
      `Should create ${RestrictionCode.PTSSR} restriction and not archive the application` +
        " when the institution reports an unsuccessful completion.",
      async () => {
        // Arrange
        mockFormioDryRun({
          validDryRun: true,
          studentScholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
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
        let createdScholasticStandingId: number;

        // Act/Assert
        await request(app.getHttpServer())
          .post(endpoint)
          .send(payload)
          .auth(institutionUserToken, BEARER_AUTH_TYPE)
          .expect(HttpStatus.CREATED)
          .expect((response) => {
            createdScholasticStandingId = response.body.id;
            expect(createdScholasticStandingId).toBeGreaterThan(0);
          });
        // Verify the scholastic standing was created and the application is not archived.
        const scholasticStanding = await db.studentScholasticStanding.findOne({
          select: {
            id: true,
            changeType: true,
            application: { id: true, isArchived: true },
          },
          relations: {
            application: true,
          },
          where: { id: createdScholasticStandingId },
        });
        expect(scholasticStanding).toEqual({
          id: createdScholasticStandingId,
          changeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          application: { id: application.id, isArchived: false },
        });
        // Verify that student restriction PTSSR was created.
        const studentRestrictions = await getActiveStudentRestrictions(
          application.student.id,
        );
        expect(studentRestrictions).toEqual([
          {
            id: expect.any(Number),
            restriction: {
              id: expect.any(Number),
              restrictionCode: RestrictionCode.PTSSR,
            },
          },
        ]);
      },
    );
  });

  // Full-time related student restrictions.
  describe(`Full-time restrictions for '${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram}'.`, () => {
    it(`Should create an ${RestrictionCode.SSR} restriction when the student exceeds the maximum number of unsuccessful weeks application.`, async () => {
      // Arrange
      const unsuccessfulWeeks =
        SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS + 1;
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        numberOfUnsuccessfulWeeks: unsuccessfulWeeks,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          offeringInitialValues: {
            studyBreaks: {
              totalDays: unsuccessfulWeeks * 7,
            } as StudyBreaksAndWeeks,
          },
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: ssrRestriction.id,
            restrictionCode: RestrictionCode.SSR,
          },
        },
      ]);
    });

    it(
      `Should create an ${RestrictionCode.SSR} restriction when the student equals or exceeds ${SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS} weeks ` +
        " as a combination of unsuccessful weeks from legacy and SIMS.",
      async () => {
        // Arrange
        const legacyUnsuccessfulWeeks =
          SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS - 1;
        const student = await saveFakeStudent(db.dataSource);
        const legacyProfile = createFakeSFASIndividual({
          initialValues: {
            student,
            unsuccessfulCompletion: legacyUnsuccessfulWeeks,
          },
        });
        await db.sfasIndividual.save(legacyProfile);
        mockFormioDryRun({
          studentScholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          numberOfUnsuccessfulWeeks: 1,
        });
        // Create a fake application with the same student.
        const application = await saveFakeApplication(
          db.dataSource,
          {
            institutionLocation: collegeFLocation,
            student,
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
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
          .expect(HttpStatus.CREATED);
        const studentRestrictions = await getActiveStudentRestrictions(
          application.student.id,
        );
        expect(studentRestrictions).toEqual([
          {
            id: expect.any(Number),
            restriction: {
              id: ssrRestriction.id,
              restrictionCode: RestrictionCode.SSR,
            },
          },
        ]);
      },
    );

    it(`Should create an ${RestrictionCode.SSRN} restriction when the student already has an ${RestrictionCode.SSR}.`, async () => {
      // Arrange
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          offeringInitialValues: {
            studyBreaks: {
              totalDays: 1,
            } as StudyBreaksAndWeeks,
          },
        },
      );
      const ssrStudentRestriction = createFakeStudentRestriction(
        {
          student: application.student,
          restriction: ssrRestriction,
        },
        { isActive: false },
      );
      await db.studentRestriction.save(ssrStudentRestriction);
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: ssrnRestriction.id,
            restrictionCode: RestrictionCode.SSRN,
          },
        },
      ]);
    });

    it(`Should create an ${RestrictionCode.SSRN} restriction when the student already has an ${RestrictionCode.SSRN}, but it is inactive.`, async () => {
      // Arrange
      const unsuccessfulWeeks =
        SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS + 1;
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        numberOfUnsuccessfulWeeks: unsuccessfulWeeks,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          offeringInitialValues: {
            studyBreaks: {
              totalDays: unsuccessfulWeeks * 7,
            } as StudyBreaksAndWeeks,
          },
        },
      );
      const ssrnStudentRestriction = createFakeStudentRestriction(
        {
          student: application.student,
          restriction: ssrnRestriction,
        },
        { isActive: false },
      );
      await db.studentRestriction.save(ssrnStudentRestriction);
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: ssrnRestriction.id,
            restrictionCode: RestrictionCode.SSRN,
          },
        },
      ]);
    });

    it(
      "Should not create any restriction and not archive the application when the student does not exceed the maximum number of unsuccessful weeks" +
        " and does not have any history of restrictions.",
      async () => {
        // Arrange
        mockFormioDryRun({
          validDryRun: true,
          studentScholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        });
        const application = await saveFakeApplication(
          db.dataSource,
          {
            institutionLocation: collegeFLocation,
          },
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
          },
        );
        // Institution token.
        const institutionUserToken = await getInstitutionToken(
          InstitutionTokenTypes.CollegeFUser,
        );
        const endpoint = `/institutions/scholastic-standing/location/${collegeFLocation.id}/application/${application.id}`;
        let createdScholasticStandingId: number;

        // Act/Assert
        await request(app.getHttpServer())
          .post(endpoint)
          .send(payload)
          .auth(institutionUserToken, BEARER_AUTH_TYPE)
          .expect(HttpStatus.CREATED)
          .expect((response) => {
            createdScholasticStandingId = response.body.id;
            expect(createdScholasticStandingId).toBeGreaterThan(0);
          });
        // Verify the scholastic standing was created and the application is not archived.
        const scholasticStanding = await db.studentScholasticStanding.findOne({
          select: {
            id: true,
            changeType: true,
            application: { id: true, isArchived: true },
          },
          relations: {
            application: true,
          },
          where: { id: createdScholasticStandingId },
        });
        expect(scholasticStanding).toEqual({
          id: createdScholasticStandingId,
          changeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          application: { id: application.id, isArchived: false },
        });
        // Verify that no student restrictions were created.
        const studentRestrictions = await getActiveStudentRestrictions(
          application.student.id,
        );
        expect(studentRestrictions).toEqual([]);
      },
    );
  });

  describe(`Full-time restrictions for '${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}'.`, () => {
    it(`Should create a ${RestrictionCode.WTHD} restriction when the student withdrew and there is no active ${RestrictionCode.WTHD} restriction.`, async () => {
      // Arrange
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: wthdRestriction.id,
            restrictionCode: RestrictionCode.WTHD,
          },
        },
      ]);
    });

    it(`Should create an ${RestrictionCode.SSR} restriction when the student withdrew and there is an active ${RestrictionCode.WTHD} restriction.`, async () => {
      // Arrange
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      const wthdStudentRestriction = createFakeStudentRestriction(
        {
          student: application.student,
          restriction: wthdRestriction,
        },
        { isActive: true },
      );
      await db.studentRestriction.save(wthdStudentRestriction);
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: ssrRestriction.id,
            restrictionCode: RestrictionCode.SSR,
          },
        },
        {
          id: wthdStudentRestriction.id,
          restriction: {
            id: wthdRestriction.id,
            restrictionCode: RestrictionCode.WTHD,
          },
        },
      ]);
    });

    it(`Should create a ${RestrictionCode.WTHD} and an ${RestrictionCode.SSRN} restriction when the student withdraws and there is an inactive ${RestrictionCode.SSR} restriction.`, async () => {
      // Arrange
      mockFormioDryRun({
        validDryRun: true,
        studentScholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      });
      const application = await saveFakeApplication(
        db.dataSource,
        {
          institutionLocation: collegeFLocation,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      const ssrStudentRestriction = createFakeStudentRestriction(
        {
          student: application.student,
          restriction: ssrRestriction,
        },
        { isActive: false },
      );
      await db.studentRestriction.save(ssrStudentRestriction);
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
        .expect(HttpStatus.CREATED);
      const studentRestrictions = await getActiveStudentRestrictions(
        application.student.id,
      );
      expect(studentRestrictions).toEqual([
        {
          id: expect.any(Number),
          restriction: {
            id: ssrnRestriction.id,
            restrictionCode: RestrictionCode.SSRN,
          },
        },
        {
          id: expect.any(Number),
          restriction: {
            id: wthdRestriction.id,
            restrictionCode: RestrictionCode.WTHD,
          },
        },
      ]);
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
   * - `numberOfUnsuccessfulWeeks`: Number of unsuccessful weeks used during the 'Student did not complete program' scholastic standing.
   */
  //TODO - When formio container is available, remove the mock.
  function mockFormioDryRun(options?: {
    validDryRun?: boolean;
    studentScholasticStandingChangeType?: StudentScholasticStandingChangeType;
    dateOfChange?: string;
    dateOfCompletion?: string;
    dateOfWithdrawal?: string;
    numberOfUnsuccessfulWeeks?: number;
  }): void {
    const validDryRun = options?.validDryRun ?? true;
    const scholasticStandingChangeType =
      options?.studentScholasticStandingChangeType ??
      StudentScholasticStandingChangeType.SchoolTransfer;
    payload = {
      data: { scholasticStandingChangeType },
    } as ScholasticStandingAPIInDTO;
    const fallbackDate = getISODateOnlyString(new Date());

    switch (scholasticStandingChangeType) {
      case StudentScholasticStandingChangeType.StudentCompletedProgramEarly:
        payload.data.dateOfCompletion =
          options?.dateOfCompletion ?? fallbackDate;
        break;
      case StudentScholasticStandingChangeType.StudentWithdrewFromProgram:
        payload.data.dateOfWithdrawal =
          options?.dateOfWithdrawal ?? fallbackDate;
        break;
      case StudentScholasticStandingChangeType.SchoolTransfer:
        payload.data.dateOfChange = options?.dateOfChange ?? fallbackDate;
        break;
      case StudentScholasticStandingChangeType.StudentDidNotCompleteProgram:
        payload.data.numberOfUnsuccessfulWeeks =
          options?.numberOfUnsuccessfulWeeks ?? 1;
        break;
    }

    formService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: validDryRun,
      formName: FormNames.ReportScholasticStandingChange,
      data: payload,
    });
  }

  /**
   * Get active student restrictions for a given
   * student ID to execute the assertions.
   * @param studentId student ID.
   * @returns active student restrictions.
   */
  async function getActiveStudentRestrictions(
    studentId: number,
  ): Promise<StudentRestriction[]> {
    return db.studentRestriction.find({
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
      where: { isActive: true, student: { id: studentId } },
      order: { restriction: { restrictionCode: "ASC" } },
    });
  }
});
