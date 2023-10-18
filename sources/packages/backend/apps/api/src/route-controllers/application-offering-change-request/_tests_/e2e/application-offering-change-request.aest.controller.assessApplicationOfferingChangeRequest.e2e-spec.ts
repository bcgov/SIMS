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
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
} from "@sims/sims-db";

describe("ApplicationOfferingChangeRequestAESTController(e2e)-assessApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should assess the application offering change request for the provided application offering change request id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          application,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          },
        },
      );
    const note = "Some dummy note.";
    const payload = {
      note,
      applicationOfferingChangeRequestStatus:
        ApplicationOfferingChangeRequestStatus.Approved,
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the application offering change request was assessed as expected.
    const updatedApplicationOfferingChangeRequest =
      await db.applicationOfferingChangeRequest.findOne({
        select: {
          id: true,
          applicationOfferingChangeRequestStatus: true,
          assessedNote: { description: true },
        },
        relations: { assessedNote: true },
        where: { id: applicationOfferingChangeRequest.id },
      });
    expect(
      updatedApplicationOfferingChangeRequest.applicationOfferingChangeRequestStatus,
    ).toBe(ApplicationOfferingChangeRequestStatus.Approved);
    expect(
      updatedApplicationOfferingChangeRequest.assessedNote.description,
    ).toBe(note);
  });

  it("Should throw a HttpStatus Not Found (404) error when an application offering change is not in a valid status to be assessed.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          application,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          },
        },
      );
    const note = "Some dummy note.";
    const payload = {
      note,
      applicationOfferingChangeRequestStatus:
        ApplicationOfferingChangeRequestStatus.Approved,
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Application offering change not found or not in valid status to be approved/declined.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when an invalid application offering change request status is provided.", async () => {
    // Arrange
    const note = "Some dummy note.";
    const payload = {
      note,
      applicationOfferingChangeRequestStatus:
        ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/application-offering-change-request/9999";
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "applicationOfferingChangeRequestStatus must be one of the following values: Approved, Declined by SABC",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized AEST user tries to assess the application offering change request.", async () => {
    // Arrange
    const note = "Some dummy note.";
    const payload = {
      note,
      applicationOfferingChangeRequestStatus:
        ApplicationOfferingChangeRequestStatus.Approved,
    };
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = "/aest/application-offering-change-request/9999";
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
