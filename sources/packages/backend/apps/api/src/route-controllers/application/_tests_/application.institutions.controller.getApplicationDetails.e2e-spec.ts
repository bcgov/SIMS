import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { getUserFullName } from "../../../utilities";

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

    // Create new application.
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        offeringInitialValues: offeringInitialValues,
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
      .expect({
        data: {},
        id: savedApplication.id,
        applicationStatus: savedApplication.applicationStatus,
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
      });
  });

  it("Should not have access to get the student application details when the student submitted an application to non-public institution.", async () => {
    // Arrange
    // Create new application.
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
      .expect({
        statusCode: 403,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should not get the student application details when application is submitted for different institution.", async () => {
    // Arrange
    // Create new application.
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
      .expect({
        statusCode: 403,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should not get the student application details when the application status is edited.", async () => {
    // Arrange
    const savedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
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
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: 403,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should get the latest student application details when the optional query parameter isParentApplication is set to true.", async () => {
    // Arrange
    const offeringInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.fullTime,
    } as EducationProgramOffering;

    const firstApplication = await saveFakeApplication(
      db.dataSource,
      { institutionLocation: collegeFLocation },
      {
        applicationStatus: ApplicationStatus.Edited,
        offeringInitialValues: offeringInitialValues,
      },
    );
    firstApplication.parentApplication = {
      id: firstApplication.id,
    } as Application;
    firstApplication.precedingApplication = firstApplication.parentApplication;
    const savedFirstApplication = await db.application.save(firstApplication);

    const secondApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: firstApplication.student,
        institutionLocation: collegeFLocation,
        precedingApplication: { id: savedFirstApplication.id } as Application,
        parentApplication: { id: savedFirstApplication.id } as Application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationNumber: savedFirstApplication.applicationNumber,
        offeringInitialValues: offeringInitialValues,
      },
    );

    const thirdApplication = await saveFakeApplication(
      db.dataSource,
      {
        student: firstApplication.student,
        institutionLocation: collegeFLocation,
        precedingApplication: { id: secondApplication.id } as Application,
        parentApplication: {
          id: savedFirstApplication.parentApplication.id,
        } as Application,
      },
      {
        applicationStatus: ApplicationStatus.InProgress,
        applicationNumber: savedFirstApplication.applicationNumber,
        offeringInitialValues: offeringInitialValues,
      },
    );

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/application/student/${firstApplication.student.id}/application/${firstApplication.id}?isParentApplication=true`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        data: {},
        id: thirdApplication.id,
        applicationStatus: thirdApplication.applicationStatus,
        applicationNumber: thirdApplication.applicationNumber,
        isArchived: false,
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: thirdApplication.programYear.id,
        studentFullName: getUserFullName(thirdApplication.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: offeringInitialValues.studyStartDate,
        applicationEndDate: offeringInitialValues.studyEndDate,
        applicationInstitutionName:
          thirdApplication.location.institution.legalOperatingName,
        isChangeRequestAllowedForPY: false,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
