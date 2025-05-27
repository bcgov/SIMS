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

describe("ApplicationChangeRequestAESTController(e2e)-getApplicationChangeRequests", () => {
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
    // Create a change request application that is pending approval.
    const pendingChangeRequest = await saveFakeApplication(
      db.dataSource,
      { precedingApplication: originalApplication },
      {
        initialValues: {
          applicationNumber: "PNDSHNGE01",
          applicationStatus: ApplicationStatus.Edited,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
          submittedDate: new Date(),
        },
      },
    );
    // Second pending change request.
    await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        applicationNumber: "PNDSHNGE02",
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        submittedDate: new Date(),
      },
    });
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint =
      "/aest/application-change-request/pending?page=0&pageLimit=1&searchCriteria=PNDSHNGE";

    // Act/Assert
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

  it(`Should not include applications when the application edit status is not ${ApplicationEditStatus.ChangePendingApproval}.`, async () => {
    // Arrange
    const notPendingChangeApplicationNumber = "NTPNDGCHNG";
    await saveFakeApplication(db.dataSource, undefined, {
      initialValues: {
        applicationNumber: notPendingChangeApplicationNumber,
        applicationStatus: ApplicationStatus.Completed,
        applicationEditStatus: ApplicationEditStatus.Original,
      },
    });
    // Create another application with ChangeDeclined status.
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

  it("Should throw bad request error when page is provided with invalid parameter value.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/application-change-request/pending";

    // Act/Assert
    // Page parameter should be a positive integer.
    await request(app.getHttpServer())
      .get(endpoint)
      .query({
        page: -1,
        pageLimit: 10,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["page must not be less than 0"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
