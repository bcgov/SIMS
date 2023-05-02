import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
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
import {
  Application,
  Institution,
  InstitutionLocation,
  Student,
} from "@sims/sims-db";

describe("ApplicationInstitutionsController(e2e)-getApplicationDetails", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;
  let student: Student;

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
    applicationRepo = appDataSource.getRepository(Application);

    // Student has a submitted application to the institution.
    student = await saveFakeStudent(appDataSource);
  });

  it(
    "Should get the student application details when student has a submitted application" +
      "for the institution (application with location id saved).",
    async () => {
      // Arrange
      const savedApplication = await saveFakeApplication(appDataSource, {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
      });

      const endpoint = `/institutions/applications/${savedApplication.id}`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication.id,
              applicationNumber: savedApplication.applicationNumber,
              studyStartPeriod:
                savedApplication.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication.currentAssessment.offering.studyEndDate,
              applicationName: "Financial Aid Application",
              status: savedApplication.applicationStatus,
            },
          ],
          count: 1,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
