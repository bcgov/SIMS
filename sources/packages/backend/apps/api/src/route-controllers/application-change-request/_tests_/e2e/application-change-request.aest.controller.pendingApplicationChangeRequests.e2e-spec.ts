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

describe("ApplicationChangeRequestAESTController(e2e)-pendingApplicationChangeRequests", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(`Should get applications when the application edit status is ${ApplicationEditStatus.ChangePendingApproval} as per the search criteria and pagination options.`, async () => {
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
          applicationNumber: "PNDCHNGE01",
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
          submittedDate: new Date(),
        },
      },
    );
    // Second pending change request with the same application number
    await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        applicationNumber: "PNDCHNGE02",
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        submittedDate: new Date(),
      },
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=1&searchCriteria=PNDCHNGE";

    // Act
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          // The default sort order is by submittedDate in ascending order.
          {
            applicationId: pendingChangeRequest.id,
            precedingApplicationId: originalApplication.id,
            studentId: pendingChangeRequest.student.id,
            submittedDate: pendingChangeRequest.submittedDate.toISOString(),
            firstName: pendingChangeRequest.student.user.firstName,
            lastName: pendingChangeRequest.student.user.lastName,
            applicationNumber: pendingChangeRequest.applicationNumber,
          },
        ],
        count: 2,
      });
  });

  it(`Should not include applications when the application edit status is not ${ApplicationEditStatus.ChangePendingApproval}`, async () => {
    // Arrange
    const notPendingChangeApplicationNumber = "NTPNDGCHNG";
    await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        applicationNumber: notPendingChangeApplicationNumber,
        applicationStatus: ApplicationStatus.Completed,
        applicationEditStatus: ApplicationEditStatus.Original,
      },
    });
    // Create another application with ChangeDeclined status
    await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        applicationNumber: notPendingChangeApplicationNumber,
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      },
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application-change-request/pending?page=0&pageLimit=10&searchCriteria=${notPendingChangeApplicationNumber}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ results: [], count: 0 });
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
