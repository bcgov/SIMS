import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import { SuccessWaitingStatus } from "../models/application.dto";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus, ProgramInfoStatus } from "@sims/sims-db";

describe("ApplicationAESTController(e2e)-getInProgressApplicationDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get application in-progress details of a single independent student application with PIR required.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.InProgress,
      pirStatus: ProgramInfoStatus.required,
    });

    const endpoint = `/aest/application/${application.id}/in-progress`;
    // As the feature is accessible for all groups, using a group other than business administrators.
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationStatus: ApplicationStatus.InProgress,
        pirStatus: ProgramInfoStatus.required,
        outstandingAssessmentStatus: SuccessWaitingStatus.Success,
      });
  });

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const endpoint = "/aest/application/99999999/in-progress";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Application id 99999999 was not found.`,
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
