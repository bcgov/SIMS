import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationOfferingRequestChange,
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
import { addDays } from "@sims/utilities";

jest.setTimeout(99999999);

describe("ApplicationOfferingChangeRequestInstitutionsController(e2e)-createApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let institutionUserToken: string;
  let endpoint: string;
  const OLD_ENV = process.env;

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

    process.env = {
      ...OLD_ENV,
      BYPASS_APPLICATION_SUBMIT_VALIDATIONS: "false",
    };
  });

  it("Should able to submit application offering request for an eligible application by an institution.", async () => {
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
    // Adding start period, that belongs to the program Year.
    fakeOffering.studyStartDate = addDays(
      5,
      application.programYear.startDate,
    ).toISOString();
    fakeOffering.studyEndDate = addDays(
      85,
      application.programYear.startDate,
    ).toISOString();
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

    // Checking the created application offering change request status.
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
    // Adding start period, that belongs to the program Year.
    existingApplicationWithOverlapStudyPeriod.currentAssessment.offering.studyStartDate =
      addDays(
        5,
        existingApplicationWithOverlapStudyPeriod.programYear.startDate,
      ).toISOString();
    existingApplicationWithOverlapStudyPeriod.currentAssessment.offering.studyEndDate =
      addDays(
        85,
        existingApplicationWithOverlapStudyPeriod.programYear.startDate,
      ).toISOString();
    await db.programYear.save(
      existingApplicationWithOverlapStudyPeriod.programYear,
    );
    await db.educationProgramOffering.save(
      existingApplicationWithOverlapStudyPeriod.currentAssessment.offering,
    );

    // Student has a completed application to the institution.
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

    await db.student.save(applicationRequestForChange.student);
    await db.application.save(applicationRequestForChange);

    // New offering with full time intensity that overlaps with student existing offering.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
      institutionLocation: collegeFLocation,
    });
    // Adding start period, that overlaps with student existing offering.
    fakeOffering.studyStartDate = addDays(
      5,
      existingApplicationWithOverlapStudyPeriod.currentAssessment.offering
        .studyStartDate,
    ).toISOString();

    fakeOffering.studyEndDate = addDays(
      50,
      existingApplicationWithOverlapStudyPeriod.currentAssessment.offering
        .studyStartDate,
    ).toISOString();

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
        errorType: "STUDY_DATE_OVERLAP_ERROR",
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
    // Adding start period, that belongs to the program Year.
    fakeOffering.studyStartDate = addDays(
      5,
      application.programYear.startDate,
    ).toISOString();
    fakeOffering.studyEndDate = addDays(
      85,
      application.programYear.startDate,
    ).toISOString();
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
        errorType: "OFFERING_INTENSITY_MISMATCH",
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
    // Adding start period, that belongs to the program Year.
    fakeOffering.studyStartDate = addDays(
      400,
      application.programYear.startDate,
    ).toISOString();
    fakeOffering.studyEndDate = addDays(
      450,
      application.programYear.startDate,
    ).toISOString();

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
        statusCode: 422,
        message:
          "Program year is not matching with the application program year.",
        error: "Unprocessable Entity",
      });
  });
  // todo: double check all the tests if all the logic is required else refactor
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
    // Student SIN Validation.
    application.student.sinValidation = createFakeSINValidation({
      student: application.student,
    });
    application.data.howWillYouBeAttendingTheProgram =
      OfferingIntensity.fullTime;

    await db.student.save(application.student);
    await db.application.save(application);

    // New offering with full time intensity in different location.
    const fakeOffering = createFakeEducationProgramOffering({
      auditUser: savedUser,
    });
    // Adding start period, that belongs to the program Year.
    fakeOffering.studyStartDate = addDays(
      5,
      application.programYear.startDate,
    ).toISOString();
    fakeOffering.studyEndDate = addDays(
      85,
      application.programYear.startDate,
    ).toISOString();

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
        statusCode: 401,
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
        statusCode: 404,
        message: "Application not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
