import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationExceptionStatus, ApplicationStatus } from "@sims/sims-db";
import { saveFakeApplicationWithApplicationException } from "../application-exception-helper";
import { createE2EDataSources, E2EDataSources } from "@sims/test-utils";
import { FieldSortOrder } from "@sims/utilities";

describe("ApplicationExceptionAESTController(e2e)-getPendingApplicationExceptions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return two pending application exceptions when the search criteria matches and a custom sort (applicationNumber DESC) is applied.", async () => {
    const applicationPrefix = "AEEGPAEA";
    // Arrange
    const applicationScenarios: {
      exceptionStatus: ApplicationExceptionStatus;
      applicationStatus?: ApplicationStatus;
    }[] = [
      { exceptionStatus: ApplicationExceptionStatus.Pending },
      { exceptionStatus: ApplicationExceptionStatus.Pending },
      // Approved exceptions should be excluded.
      { exceptionStatus: ApplicationExceptionStatus.Approved },
      // Declined exceptions should be excluded.
      { exceptionStatus: ApplicationExceptionStatus.Declined },
      // Edited applications should be excluded.
      {
        exceptionStatus: ApplicationExceptionStatus.Pending,
        applicationStatus: ApplicationStatus.Edited,
      },
      // Cancelled applications should be excluded.
      {
        exceptionStatus: ApplicationExceptionStatus.Pending,
        applicationStatus: ApplicationStatus.Cancelled,
      },
    ];

    const applicationPromises = applicationScenarios.map(
      ({ exceptionStatus, applicationStatus }, index) =>
        saveFakeApplicationWithApplicationException(db.dataSource, undefined, {
          applicationStatus,
          // Create data specific to this test suite to avoid retrieving data from other test suites.
          applicationNumber: generateApplicationNumber(
            applicationPrefix,
            index,
          ),
          applicationExceptionStatus: exceptionStatus,
        }),
    );

    const [application1, application2] = await Promise.all(applicationPromises);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint(applicationPrefix))
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        expect(body.results).toEqual([
          {
            applicationId: application2.id,
            studentId: application2.student.id,
            applicationNumber: application2.applicationNumber,
            givenNames: application2.student.user.firstName,
            lastName: application2.student.user.lastName,
            submittedDate:
              application2.applicationException.createdAt.toISOString(),
          },
          {
            applicationId: application1.id,
            studentId: application1.student.id,
            applicationNumber: application1.applicationNumber,
            givenNames: application1.student.user.firstName,
            lastName: application1.student.user.lastName,
            submittedDate:
              application1.applicationException.createdAt.toISOString(),
          },
        ]);
        expect(body.count).toEqual(2);
      });
  });

  it("Should return no application exceptions when the search criteria doesn't match.", async () => {
    const applicationPrefix = "AEEGPAEB";
    // Arrange
    await saveFakeApplicationWithApplicationException(
      db.dataSource,
      undefined,
      {
        // Create data specific to this test suite to avoid retrieving data from other test suites.
        applicationNumber: generateApplicationNumber(applicationPrefix, 0),
        applicationExceptionStatus: ApplicationExceptionStatus.Pending,
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint("NOMATCH"))
      .auth(token, BEARER_AUTH_TYPE)
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
 * Gets the endpoint to retrieve pending application exceptions.
 * @returns Endpoint for pending application exceptions.
 * @param searchCriteria Search criteria for filtering application exceptions.
 * @param sortField Field to sort the results by. Defaults to "submittedDate".
 * @param sortOrder Order to sort the results. Can be "ASC" or "DESC". Defaults to "DESC".
 */
function getEndpoint(
  searchCriteria: string,
  sortField: string = "submittedDate",
  sortOrder: FieldSortOrder = FieldSortOrder.DESC,
): string {
  return `/aest/application-exception?page=0&pageLimit=100&sortField=${sortField}&sortOrder=${sortOrder}&searchCriteria=${searchCriteria}`;
}

/**
 * Generates an application number based on the provided prefix and index.
 * @param prefix Application number prefix.
 * @param index Application number index.
 * @returns Generated application number.
 */
function generateApplicationNumber(prefix: string, index: number): string {
  return `${prefix}${String(index + 1).padStart(2, "0")}`;
}
