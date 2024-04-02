import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus } from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-getApplicationAssessmentStatusDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get application and assessment status details when requested.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    application.studentAssessments = [application.currentAssessment];
    application.isArchived = true;
    await db.application.save(application);

    const endpoint = `/aest/application/${application.id}/assessment-details`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationId: application.id,
        originalAssessmentStatus:
          application.studentAssessments[0].studentAssessmentStatus,
        isApplicationArchived: application.isArchived,
        applicationStatus: application.applicationStatus,
      });
  });

  it("Should throw not found error when cannot find application.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/assessment-details";
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
