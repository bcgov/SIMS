import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeApplication,
} from "@sims/test-utils";
import { Institution, InstitutionLocation } from "@sims/sims-db";

describe("ApplicationInstitutionsController(e2e)-getApplicationDetails", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
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
    collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it(
    "Should get the student application details when student has a submitted application " +
      "for the institution (application with location id saved).",
    async () => {
      // Arrange
      // Student has a submitted application to the institution.
      const student = await saveFakeStudent(appDataSource);
      //Create new application.
      const savedApplication = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      const endpoint = `/institutions/application/${savedApplication.id}/student/${student.id}`;
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
        });
    },
  );

  it(
    "Should not have access to get the student application details when student has a submitted application " +
      "for a different institution (application with location id saved).",
    async () => {
      // Arrange
      // Student has a submitted application to the institution.
      const student = await saveFakeStudent(appDataSource);
      //Create new application.
      const savedApplication = await saveFakeApplication(appDataSource, {
        institutionLocation: collegeCLocation,
        student,
      });

      const endpoint = `/institutions/application/${savedApplication.id}/student/${student.id}`;
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
          message: "Forbidden resource",
          error: "Forbidden",
        });
    },
  );

  it("Should not get the student application details when application is submitted for different institution ", async () => {
    // Arrange
    // Student has a submitted application to the institution.
    const student = await saveFakeStudent(appDataSource);
    //Create new application.
    const savedApplication = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeCLocation,
      student,
    });

    const endpoint = `/institutions/application/${savedApplication.id}/student/${student.id}`;
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
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
