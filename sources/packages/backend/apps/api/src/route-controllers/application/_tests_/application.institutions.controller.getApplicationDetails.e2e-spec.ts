import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
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
  createFakeInstitutionLocation,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  EducationProgramOffering,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  addDays,
  getDateOnlyFormat,
  getISODateOnlyString,
} from "@sims/utilities";
import { getUserFullName } from "../../../utilities";

describe("ApplicationInstitutionsController(e2e)-getApplicationDetails", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeFLocation: InstitutionLocation;
  let collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // College C.
    const { institution: collegeC } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      appDataSource,
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
      appDataSource,
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
        applicationFormName: "SFAA2022-23",
        applicationProgramYearID: savedApplication.programYearId,
        studentFullName: getUserFullName(savedApplication.student.user),
        applicationOfferingIntensity: offeringInitialValues.offeringIntensity,
        applicationStartDate: getDateOnlyFormat(
          offeringInitialValues.studyStartDate,
        ),
        applicationEndDate: getDateOnlyFormat(
          offeringInitialValues.studyEndDate,
        ),
        applicationInstitutionName:
          savedApplication.location.institution.legalOperatingName,
      });
  });

  it("Should not have access to get the student application details when the student submitted an application to non-public institution.", async () => {
    // Arrange
    // Create new application.
    const savedApplication = await saveFakeApplication(appDataSource, {
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
    const savedApplication = await saveFakeApplication(appDataSource, {
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

  afterAll(async () => {
    await app?.close();
  });
});
