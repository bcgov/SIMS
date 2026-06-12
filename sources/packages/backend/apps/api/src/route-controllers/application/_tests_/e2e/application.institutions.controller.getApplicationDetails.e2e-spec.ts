import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationEditStatus,
  ApplicationStatus,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingIntensity,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import {
  getUserFullName,
  getOfferingNameAndPeriod,
} from "../../../../utilities";

describe("ApplicationInstitutionsController(e2e)-getApplicationDetails", () => {
  let app: INestApplication;
  let collegeFLocation: InstitutionLocation;
  let collegeCLocation: InstitutionLocation;
  let db: E2EDataSources;

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
    // College C.
    const { institution: collegeC } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should get the student application details when student has a submitted application for the institution.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    // Submitted application for College F.
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    const student = savedApplication.student;
    const endpoint = `/institutions/application/student/${student.id}/application/${savedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          data: {},
          id: savedApplication.id,
          applicationStatus: savedApplication.applicationStatus,
          applicationEditStatus: savedApplication.applicationEditStatus,
          applicationNumber: savedApplication.applicationNumber,
          isArchived: false,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: savedApplication.programYear.id,
          studentFullName: getUserFullName(savedApplication.student.user),
          applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
          applicationStartDate: offeringInitialValues.studyStartDate,
          applicationEndDate: offeringInitialValues.studyEndDate,
          applicationInstitutionName:
            savedApplication.location.institution.legalOperatingName,
          isChangeRequestAllowedForPY: false,
        }),
      );
  });

  it("Should throw a HttpStatus Forbidden (403) error when a non-public institution accesses the application.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeCLocation,
    });

    const student = savedApplication.student;
    const endpoint = `/institutions/application/student/${student.id}/application/${savedApplication.id}`;
    const institutionUserTokenCUser = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserTokenCUser, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  it("Should not get the student application details when application is submitted for a different institution.", async () => {
    // Arrange
    // Submitted application for College C.
    const savedApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeCLocation,
    });

    const student = savedApplication.student;
    const endpoint = `/institutions/application/student/${student.id}/application/${savedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  it("Should not get the student application details when the application is a Change Request with edit status Change in progress.", async () => {
    // Arrange
    // Complete Application for College F.
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const student = completedApplication.student;
    // Change Request Application for College F.
    const changeRequestApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
        student,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      },
    );

    const endpoint = `/institutions/application/student/${student.id}/application/${changeRequestApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  it("Should get the student application details when student has an Edited application for the institution and a subsequent Submitted application for another institution.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    // Edited application for College F.
    const editedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { applicationStatus: ApplicationStatus.Edited },
    );
    const student = editedApplication.student;

    // Subsequent Submitted application for College C.
    const submittedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeCLocation,
        student,
        parentApplication: editedApplication,
        precedingApplication: editedApplication,
      },
      {
        applicationStatus: ApplicationStatus.Submitted,
        offeringInitialValues: offeringInitialValues,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    const endpoint = `/institutions/application/student/${student.id}/application/${submittedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual({
          data: {},
          id: submittedApplication.id,
          applicationStatus: submittedApplication.applicationStatus,
          applicationEditStatus: submittedApplication.applicationEditStatus,
          applicationNumber: submittedApplication.applicationNumber,
          isArchived: false,
          applicationFormName: "SFAA2022-23",
          applicationProgramYearID: submittedApplication.programYear.id,
          studentFullName: getUserFullName(submittedApplication.student.user),
          applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
          applicationStartDate: offeringInitialValues.studyStartDate,
          applicationEndDate: offeringInitialValues.studyEndDate,
          applicationInstitutionName:
            submittedApplication.location.institution.legalOperatingName,
          isChangeRequestAllowedForPY: false,
        }),
      );
  });

  it("Should return PIR summary fields in application data when the application has PIR status completed.", async () => {
    // Arrange
    const offeringInitialValues = {
      name: "Test PIR Offering Name",
      studyStartDate: "2024-09-01",
      studyEndDate: "2025-04-30",
      yearOfStudy: 2,
    } as Partial<EducationProgramOffering>;
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Assessment,
        offeringIntensity: OfferingIntensity.fullTime,
        pirStatus: ProgramInfoStatus.completed,
        offeringInitialValues,
      },
    );
    // Load the offering with its education program to build expected values.
    const savedOffering = await db.educationProgramOffering.findOne({
      where: { id: savedApplication.currentAssessment.offering.id },
      relations: { educationProgram: true },
      select: {
        id: true,
        name: true,
        studyStartDate: true,
        studyEndDate: true,
        yearOfStudy: true,
        educationProgram: { id: true, name: true },
      },
    });
    const student = savedApplication.student;
    const endpoint = `/institutions/application/student/${student.id}/application/${savedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body.data.pirSummaryProgramName).toBe(
      savedOffering.educationProgram.name,
    );
    expect(response.body.data.pirSummaryOfferingName).toBe(
      getOfferingNameAndPeriod(savedOffering),
    );
  });

  it("Should not return PIR summary fields in application data when the application does not have PIR status completed.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Assessment,
        offeringIntensity: OfferingIntensity.fullTime,
        pirStatus: ProgramInfoStatus.notRequired,
      },
    );
    const student = savedApplication.student;
    const endpoint = `/institutions/application/student/${student.id}/application/${savedApplication.id}`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body.data.pirSummaryProgramName).toBeUndefined();
    expect(response.body.data.pirSummaryOfferingName).toBeUndefined();
  });

  afterAll(async () => {
    await app?.close();
  });
});
