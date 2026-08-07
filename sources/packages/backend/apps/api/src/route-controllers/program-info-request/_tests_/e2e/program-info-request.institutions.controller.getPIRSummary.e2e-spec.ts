import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeInstitutionLocation,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  ApplicationData,
  ApplicationStatus,
  InstitutionLocation,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";

const APPLICATION_PREFIX = "PIRSUMM";

describe("ProgramInfoRequestInstitutionsController(e2e)-getPIRSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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

  it("Should return two ordered PIR requests when the search criteria matches and the default sort is applied.", async () => {
    // Arrange
    const applicationScenarios: {
      pirStatus: ProgramInfoStatus;
      applicationStatus?: ApplicationStatus;
    }[] = [
      {
        pirStatus: ProgramInfoStatus.completed,
        applicationStatus: ApplicationStatus.InProgress,
      },
      {
        pirStatus: ProgramInfoStatus.required,
        applicationStatus: ApplicationStatus.InProgress,
      },
      {
        // Not required PIRs should be excluded.
        pirStatus: ProgramInfoStatus.notRequired,
        applicationStatus: ApplicationStatus.Assessment,
      },
      {
        pirStatus: ProgramInfoStatus.required,
        // Edited applications should be excluded.
        applicationStatus: ApplicationStatus.Edited,
      },
      {
        pirStatus: ProgramInfoStatus.required,
        // Cancelled applications should be excluded.
        applicationStatus: ApplicationStatus.Cancelled,
      },
    ];
    const applicationData = {
      workflowName: "workflowName",
      programName: "PIR summary program",
      studystartDate: "2026-09-01",
      studyendDate: "2027-04-30",
    } as ApplicationData;
    const applicationPromises = applicationScenarios.map(
      ({ pirStatus, applicationStatus }, index) => {
        return saveFakeApplication(
          db.dataSource,
          { institutionLocation: collegeFLocation },
          {
            applicationNumber: generateApplicationNumber(index),
            applicationStatus,
            applicationData,
            pirStatus,
          },
        );
      },
    );

    const [application1, application2] = await Promise.all(applicationPromises);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(collegeFLocation.id, APPLICATION_PREFIX);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            applicationId: application2.id,
            applicationNumber: application2.applicationNumber,
            studyStartPeriod: applicationData.studystartDate,
            studyEndPeriod: applicationData.studyendDate,
            pirStatus: application2.pirStatus,
            submittedDate: getISODateOnlyString(application2.submittedDate),
            givenNames: application2.student.user.firstName,
            lastName: application2.student.user.lastName,
            studentNumber: application2.studentNumber,
            studyIntensity: application2.offeringIntensity,
            program: applicationData.programName,
          },
          {
            applicationId: application1.id,
            applicationNumber: application1.applicationNumber,
            studyStartPeriod:
              application1.currentAssessment.offering.studyStartDate,
            studyEndPeriod:
              application1.currentAssessment.offering.studyEndDate,
            pirStatus: application1.pirStatus,
            submittedDate: getISODateOnlyString(application1.submittedDate),
            givenNames: application1.student.user.firstName,
            lastName: application1.student.user.lastName,
            studentNumber: application1.studentNumber,
            studyIntensity: application1.offeringIntensity,
            program:
              application1.currentAssessment.offering.educationProgram.name,
          },
        ]);
        expect(body.count).toEqual(2);
      });
  });

  it("Should return no PIR requests when the search criteria doesn't match.", async () => {
    // Arrange
    await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
      // Create data specific to this test case to avoid retrieving data from other tests.
      applicationNumber: generateApplicationNumber(5),
      pirStatus: ProgramInfoStatus.required,
    });

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(collegeFLocation.id, "NOMATCH");

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([]);
        expect(body.count).toEqual(0);
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to retrieve the PIR summary for an institution location.
 * @param locationId Institution location ID.
 * @param search Search criteria used to filter the PIR applications.
 * @returns Endpoint for the PIR summary.
 */
function getEndpoint(locationId: number, search: string): string {
  return `/institutions/location/${locationId}/program-info-request?page=0&pageLimit=100&search=${search}`;
}

/**
 * Generates an application number based on a fixed prefix and index.
 * @param index Application number index.
 * @returns Generated application number.
 */
function generateApplicationNumber(index: number): string {
  return `${APPLICATION_PREFIX}${String(index + 1).padStart(3, "0")}`;
}
