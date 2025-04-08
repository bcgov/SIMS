import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  getAuthorizedLocation,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationDisbursements,
  createFakeEducationProgramOffering,
  createFakeUser,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { STUDY_DATE_OVERLAP_ERROR } from "../../../../utilities";
import { OFFERING_INTENSITY_MISMATCH } from "../../../../constants";
import { InstitutionUserTypes } from "../../../../auth";

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-createApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let institutionUserToken: string;
  let endpoint: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
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

    endpoint = `/institutions/location/${collegeFLocation.id}/application-offering-change-request`;

    // To check the study overlap, the BYPASS_APPLICATION_SUBMIT_VALIDATIONS needs to be set false.
    process.env.BYPASS_APPLICATION_SUBMIT_VALIDATIONS = "false";
  });

  it("Should be able to submit application offering request for an eligible application by an institution.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    // Updating study period, that belongs to the program year.
    fakeOffering.studyStartDate = getISODateOnlyString(
      addDays(5, application.programYear.startDate),
    );
    fakeOffering.studyEndDate = getISODateOnlyString(
      addDays(85, application.programYear.startDate),
    );
    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    let responseApplicationOfferingChangeRequest = undefined;
    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        responseApplicationOfferingChangeRequest = response.body;
        expect(responseApplicationOfferingChangeRequest).toHaveProperty("id");
        expect(responseApplicationOfferingChangeRequest.id).toBeGreaterThan(0);
      });

    // Get the created application offering change request status.
    const applicationOfferingChangeRequest =
      await db.applicationOfferingChangeRequest.findOne({
        select: {
          applicationOfferingChangeRequestStatus: true,
        },
        where: {
          id: responseApplicationOfferingChangeRequest.id,
        },
      });

    // Newly created application offering change request status will be in progress with students.
    expect(applicationOfferingChangeRequest).toHaveProperty(
      "applicationOfferingChangeRequestStatus",
      ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
    );
  });

  it("Should not be able to submit application offering request with a read-only user.", async () => {
    // Arrange
    const collegeELocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeEReadOnlyUser,
      InstitutionUserTypes.readOnlyUser,
    );
    const endpoint = `/institutions/location/${collegeELocation.id}/application-offering-change-request`;
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

  it("Should throw study overlap error when trying to submit application offering request with an offering, which overlap with students another application.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const existingApplicationWithOverlapStudyPeriod =
      await saveFakeApplicationDisbursements(
        db.dataSource,
        { institutionLocation: collegeFLocation },
        {
          applicationStatus: ApplicationStatus.Completed,
        },
      );
    const student = existingApplicationWithOverlapStudyPeriod.student;

    // Updating study period, that belongs to the program year.
    existingApplicationWithOverlapStudyPeriod.currentAssessment.offering.studyStartDate =
      getISODateOnlyString(
        addDays(
          5,
          existingApplicationWithOverlapStudyPeriod.programYear.startDate,
        ),
      );
    existingApplicationWithOverlapStudyPeriod.currentAssessment.offering.studyEndDate =
      getISODateOnlyString(
        addDays(
          85,
          existingApplicationWithOverlapStudyPeriod.programYear.startDate,
        ),
      );

    await db.educationProgramOffering.save(
      existingApplicationWithOverlapStudyPeriod.currentAssessment.offering,
    );

    // Student has a new completed application to the institution, which will be requested for change.
    const applicationRequestForChange = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
        student: student,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    // Student SIN Validation.
    applicationRequestForChange.student.sinValidation = createFakeSINValidation(
      {
        student: student,
      },
    );
    applicationRequestForChange.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;
    applicationRequestForChange.offeringIntensity = OfferingIntensity.fullTime;

    await db.student.save(applicationRequestForChange.student);
    await db.application.save(applicationRequestForChange);

    // New offering with full time intensity that overlaps with student existing offering.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    // Updating study period, that overlaps with student existing application offering.
    fakeOffering.studyStartDate = getISODateOnlyString(
      addDays(
        5,
        existingApplicationWithOverlapStudyPeriod.currentAssessment.offering
          .studyStartDate,
      ),
    );

    fakeOffering.studyEndDate = getISODateOnlyString(
      addDays(
        50,
        existingApplicationWithOverlapStudyPeriod.currentAssessment.offering
          .studyStartDate,
      ),
    );

    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: applicationRequestForChange.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study period or a pending PIR.",
        errorType: STUDY_DATE_OVERLAP_ERROR,
      });
  });

  it("Should throw offering intensity error when trying to submit application offering request with an offering with different offering intensity.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with part time intensity.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    fakeOffering.offeringIntensity = OfferingIntensity.partTime;

    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Offering intensity does not match with the student selected offering.",
        errorType: OFFERING_INTENSITY_MISMATCH,
      });
  });

  it("Should throw offering program year mismatch error when trying to submit application offering request with an offering with different offering program year.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    // Updating study period, that belongs to a future(different) program year.
    fakeOffering.studyStartDate = getISODateOnlyString(
      addDays(400, application.programYear.startDate),
    );
    fakeOffering.studyEndDate = getISODateOnlyString(
      addDays(450, application.programYear.startDate),
    );

    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Program year is not matching with the application program year.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw offering does not belong to the location error when trying to submit application offering request with an offering with different location.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    // New offering with full time intensity in different location.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });

    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNAUTHORIZED)
      .expect({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: "The location does not have access to the offering.",
        error: "Unauthorized",
      });
  });

  it("Should throw application not found error when trying to submit application offering request with application belonging to different location.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    // New offering with full time intensity in different location.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });

    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application not found.",
        error: "Not Found",
      });
  });

  it("Should throw application not found error when trying to submit application offering request with a archived application.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed archived application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    application.isArchived = true;
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    // Updating study period, that belongs to the program year.
    fakeOffering.studyStartDate = getISODateOnlyString(
      addDays(5, application.programYear.startDate),
    );
    fakeOffering.studyEndDate = getISODateOnlyString(
      addDays(85, application.programYear.startDate),
    );
    await db.educationProgramOffering.save(fakeOffering);

    const payload = {
      applicationId: application.id,
      offeringId: fakeOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
      .expect({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          "Error while submitting an application offering change request",
        error: "Internal Server Error",
      });
  });

  it("Should throw program is not active error when trying to submit an application offering request for an inactive program.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity.
    const newOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
        institutionLocation: collegeFLocation,
      },
      { programInitialValues: { isActive: false } },
    );
    // Updating study period, that belongs to the program year.
    newOffering.studyStartDate = getISODateOnlyString(
      addDays(5, application.programYear.startDate),
    );
    newOffering.studyEndDate = getISODateOnlyString(
      addDays(85, application.programYear.startDate),
    );
    await db.educationProgramOffering.save(newOffering);

    const payload = {
      applicationId: application.id,
      offeringId: newOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The education program is not active.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw program is expired error when trying to submit an application offering request for an expired program.", async () => {
    // Arrange
    const savedUser = await db.user.save(createFakeUser());
    // Student has a completed application to the institution.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity.
    const newOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
        institutionLocation: collegeFLocation,
      },
      {
        initialValues: {
          studyStartDate: getISODateOnlyString(
            addDays(5, application.programYear.startDate),
          ),
          studyEndDate: getISODateOnlyString(
            addDays(85, application.programYear.startDate),
          ),
        },
        programInitialValues: {
          effectiveEndDate: getISODateOnlyString(new Date()),
        },
      },
    );
    await db.educationProgramOffering.save(newOffering);

    const payload = {
      applicationId: application.id,
      offeringId: newOffering.id,
      reason: "Test reason.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The education program is expired.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
