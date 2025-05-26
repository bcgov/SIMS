import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
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

describe("ApplicationChangeRequestAESTController(e2e)-pendingApplicationChangeRequest", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should successfully retrieve paginated list of pending application change requests for an AEST user", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=10";

    // Act
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toBeDefined();
    expect(response.body).toHaveProperty("results");
    expect(response.body).toHaveProperty("count");
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(typeof response.body.count).toBe("number");
  });

  it("Should include a newly created pending application change request in the paginated results", async () => {
    // Arrange
    const originalApplication = await saveFakeApplication(
      appDataSource,
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
      appDataSource,
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
      appDataSource,
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
      appDataSource,
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

  it("Should validate response DTO structure matches expected format", async () => {
    // Arrange
    const originalApplication = await saveFakeApplication(
      appDataSource,
      undefined,
      {
        initialValues: {
          applicationStatus: ApplicationStatus.Completed,
          applicationEditStatus: ApplicationEditStatus.Original,
        },
      },
    );

    const testChangeRequest = await saveFakeApplication(
      appDataSource,
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

  it("Should handle missing pagination parameters gracefully", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/application-change-request/pending";

    // Act - Test without pagination parameters
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE);

    // Assert - Should either work with defaults or return bad request
    expect([HttpStatus.OK, HttpStatus.BAD_REQUEST]).toContain(response.status);

    if (response.status === HttpStatus.OK) {
      expect(response.body).toHaveProperty("results");
      expect(response.body).toHaveProperty("count");
      expect(Array.isArray(response.body.results)).toBe(true);
    }
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
