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
import { Application, ApplicationStatus } from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ApplicationAESTController(e2e)-getApplicationOverallDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get all application versions in overall details when there is one or more edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const firstVersionApplication = await saveFakeApplication(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Edited,
        submittedDate: addDays(-2),
      },
    );

    const secondVersionApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: firstVersionApplication.id } as Application,
        precedingApplication: { id: firstVersionApplication.id } as Application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: addDays(-1),
      },
    );

    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        parentApplication: { id: firstVersionApplication.id } as Application,
        precedingApplication: {
          id: secondVersionApplication.id,
        } as Application,
      },
      {
        applicationNumber: firstVersionApplication.applicationNumber,
        offeringIntensity:
          firstVersionApplication.currentAssessment.offering.offeringIntensity,
        submittedDate: new Date(),
      },
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${currentApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        previousVersions: [
          {
            id: secondVersionApplication.id,
            submittedDate: secondVersionApplication.submittedDate.toISOString(),
            applicationEditStatus:
              secondVersionApplication.applicationEditStatus,
          },
          {
            id: firstVersionApplication.id,
            submittedDate: firstVersionApplication.submittedDate.toISOString(),
            applicationEditStatus:
              firstVersionApplication.applicationEditStatus,
          },
        ],
      });
  });

  it("Should get no application versions in overall details when there is no edited application associated with the given application.", async () => {
    // Arrange
    // Create the parent application and also the first application version.
    const originalApplication = await saveFakeApplication(db.dataSource);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/application/${originalApplication.id}/overall-details`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        previousVersions: [],
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
