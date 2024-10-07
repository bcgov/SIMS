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
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus, InstitutionLocation } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("InstitutionLocationStudentsController(e2e)-getActiveApplications", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the list of all applications which are not archived when requested for Active applications", async () => {
    // Arrange
    const completedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );

    await saveFakeApplication(
      db.dataSource,
      {
        institutionLocation: collegeFLocation,
      },
      { isArchived: true },
    );

    // Institution token.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/location/${collegeFLocation.id}/active-applications?archived=false&page=0&pageLimit=10&sortField=applicationNumber&sortOrder=ASC`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual({
          count: 1,
          results: [
            {
              applicationId: completedApplication.id,
              applicationNumber: completedApplication.applicationNumber,
              applicationScholasticStandingStatus: "Available",
              fullName: getUserFullName(completedApplication.student.user),
              studyEndPeriod:
                completedApplication.currentAssessment.offering.studyEndDate,
              studyStartPeriod:
                completedApplication.currentAssessment.offering.studyStartDate,
            },
          ],
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
