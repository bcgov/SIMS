import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeApplicationOfferingRequestChange,
} from "@sims/test-utils";
import { ApplicationStatus } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("ApplicationOfferingChangeRequestAESTController(e2e)-getApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return the application offering change request details when provided with the application offering change request id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, {
        application,
      });
    const endpoint = `/aest/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .expect({
        status:
          applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus,
        applicationNumber:
          applicationOfferingChangeRequest.application.applicationNumber,
        locationName:
          applicationOfferingChangeRequest.application.location.name,
        requestedOfferingId:
          applicationOfferingChangeRequest.requestedOffering.id,
        activeOfferingId: applicationOfferingChangeRequest.activeOffering.id,
        reason: applicationOfferingChangeRequest.reason,
        studentFullName: getUserFullName(
          applicationOfferingChangeRequest.application.student.user,
        ),
        assessedDate: applicationOfferingChangeRequest.assessedDate,
        assessedBy: "",
        institutionId:
          applicationOfferingChangeRequest.application.location.institution.id,
        institutionName:
          applicationOfferingChangeRequest.application.location.institution
            .operatingName,
        submittedDate: applicationOfferingChangeRequest.createdAt.toISOString(),
        updatedDate: applicationOfferingChangeRequest.updatedAt.toISOString(),
      });
  });

  it("Should throw a HttpStatus Not Found (404) when an incorrect application offering change request is retrieved.", async () => {
    // Arrange
    const endpoint = `/aest/application-offering-change-request/9999`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find an Application Offering Change Request.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
