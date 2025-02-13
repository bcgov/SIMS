import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus } from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ApplicationAESTController(e2e)-getApplicationVersionHistory", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get an array of application versions when there is an edited application associated with the given application.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      submittedDate: new Date(),
    });

    const editedApplication = await saveFakeApplication(
      db.dataSource,
      {
        institution:
          application.currentAssessment.offering.institutionLocation
            .institution,
        institutionLocation:
          application.currentAssessment.offering.institutionLocation,
        student: application.student,
        program: application.currentAssessment.offering.educationProgram,
        offering: application.currentAssessment.offering,
        programYear: application.programYear,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationNumber: application.applicationNumber,
        offeringIntensity:
          application.currentAssessment.offering.offeringIntensity,
        pirStatus: application.pirStatus,
        submittedDate: addDays(-10),
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${application.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        previousVersions: [
          {
            id: editedApplication.id,
            submittedDate: editedApplication.submittedDate.toISOString(),
          },
        ],
      });
  });

  it("Should throw not found error when an application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/overall-details";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
