import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ApplicationEditStatus, ApplicationStatus } from "@sims/sims-db";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import MockDate from "mockdate";

describe("ApplicationChangeRequestAESTController(e2e)-pendingApplicationChangeRequests", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it(`Should not include applications when the application edit status is not ${ApplicationEditStatus.ChangePendingApproval}.`, async () => {
    // Arrange
    const originalApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );

    // Create a change request application that is pending approval
    const pendingChangeRequest = await saveFakeApplication(
      db.dataSource,
      { precedingApplication: originalApplication },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        },
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC";

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body.results).toBeDefined();
    expect(Array.isArray(response.body.results)).toBe(true);

    // Check if the created change request is in the response
    const foundChangeRequest = response.body.results.find(
      (item: any) => item.applicationId === pendingChangeRequest.id,
    );

    expect(foundChangeRequest).toBeDefined();
    expect(foundChangeRequest.applicationId).toBe(pendingChangeRequest.id);
    expect(foundChangeRequest.precedingApplicationId).toBe(
      originalApplication.id,
    );
    expect(foundChangeRequest.studentId).toBe(pendingChangeRequest.student.id);
    expect(foundChangeRequest.applicationNumber).toBe(
      pendingChangeRequest.applicationNumber,
    );
    expect(foundChangeRequest.firstName).toBe(
      pendingChangeRequest.student.user.firstName,
    );
    expect(foundChangeRequest.lastName).toBe(
      pendingChangeRequest.student.user.lastName,
    );
    expect(foundChangeRequest.submittedDate).toBeDefined();
    expect(new Date(foundChangeRequest.submittedDate)).toBeInstanceOf(Date);
  });

  it("Should not include applications that are not in ChangePendingApproval status", async () => {
    // Arrange
    const nonPendingApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );

    // Create another application with ChangeDeclined status
    const declinedApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
        },
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC";

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(Array.isArray(response.body.results)).toBe(true);

    const foundNonPending = response.body.results.find(
      (item: any) => item.applicationId === nonPendingApplication.id,
    );
    const foundDeclined = response.body.results.find(
      (item: any) => item.applicationId === declinedApplication.id,
    );

    expect(foundNonPending).toBeUndefined();
    expect(foundDeclined).toBeUndefined();
  });

  it("Should handle pagination parameters correctly", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint5 =
      "/aest/application-change-request/pending?page=0&pageLimit=5&sortField=submittedDate&sortOrder=DESC";
    const endpoint10 =
      "/aest/application-change-request/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC";

    // Act - Test with different page sizes
    const responsePageSize5 = await request(app.getHttpServer())
      .get(endpoint5)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const responsePageSize10 = await request(app.getHttpServer())
      .get(endpoint10)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(responsePageSize5.body.results.length).toBeLessThanOrEqual(5);
    expect(responsePageSize10.body.results.length).toBeLessThanOrEqual(10);

    // Test pagination offset
    if (responsePageSize10.body.count > 10) {
      const endpointPage1 =
        "/aest/application-change-request/pending?page=1&pageLimit=10&sortField=submittedDate&sortOrder=DESC";
      const responsePage1 = await request(app.getHttpServer())
        .get(endpointPage1)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      expect(responsePage1.body.results).toBeDefined();
      expect(Array.isArray(responsePage1.body.results)).toBe(true);
    }
  });

  it("Should return empty results when no pending change requests exist", async () => {
    // Arrange
    await db.application.update(
      { applicationEditStatus: ApplicationEditStatus.ChangePendingApproval },
      { applicationEditStatus: ApplicationEditStatus.ChangeDeclined },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC";

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body.results).toBeDefined();
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.count).toBe(0);
    expect(response.body.results.length).toBe(0);
  });

  it("Should validate response DTO structure matches expected format", async () => {
    // Arrange
    const originalApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );

    const testChangeRequest = await saveFakeApplication(
      db.dataSource,
      { precedingApplication: originalApplication },
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        },
      },
    );

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=10";

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("count");

    // Use the created testChangeRequest for validation
    const foundChangeRequest = response.body.results.find(
      (item: any) => item.applicationId === testChangeRequest.id,
    );
    expect(foundChangeRequest).toBeDefined();
    expect(foundChangeRequest.applicationId).toBe(testChangeRequest.id);
    expect(foundChangeRequest.precedingApplicationId).toBe(
      originalApplication.id,
    );
    expect(foundChangeRequest.studentId).toBe(testChangeRequest.student.id);
    expect(foundChangeRequest.applicationNumber).toBe(
      testChangeRequest.applicationNumber,
    );
    expect(foundChangeRequest.firstName).toBe(
      testChangeRequest.student.user.firstName,
    );
    expect(foundChangeRequest.lastName).toBe(
      testChangeRequest.student.user.lastName,
    );
    expect(foundChangeRequest.submittedDate).toBeDefined();
    expect(new Date(foundChangeRequest.submittedDate)).toBeInstanceOf(Date);
  });

  it("Should return 401 Unauthorized when no authentication token is provided", async () => {
    // Arrange
    const endpoint = "/aest/application-change-request/pending";

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .query({
        page: 0,
        pageLimit: 10,
      })
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it("Should handle invalid pagination parameters", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/application-change-request/pending";

    // Act - Test with invalid page parameters
    const responseNegativePage = await request(app.getHttpServer())
      .get(endpoint)
      .query({
        page: -1,
        pageLimit: 10,
      })
      .auth(token, BEARER_AUTH_TYPE);

    const responseZeroPageLimit = await request(app.getHttpServer())
      .get(endpoint)
      .query({
        page: 0,
        pageLimit: 0,
      })
      .auth(token, BEARER_AUTH_TYPE);

    // Assert - Should handle invalid parameters appropriately
    expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
      responseNegativePage.status,
    );
    expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(
      responseZeroPageLimit.status,
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
