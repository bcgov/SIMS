import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  AESTGroups,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import { User } from "@sims/sims-db";
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
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    const auditUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    ministryUser = { id: auditUser.id } as User;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should return pending application change requests with correct data structure.", async () => {
    // Arrange
    const application = await saveFakeApplication(appDataSource);
    const applicationChangeRequest = await saveFakeApplicationChangeRequest(
      appDataSource,
      application,
    );

    await db.applicationChangeRequestRepository.save(applicationChangeRequest);

    // Act
    const response = await request(app.getHttpServer())
      .get("/application-change-requests/pending")
      .set(
        "Authorization",
        `Bearer ${getAESTToken(appDataSource, ministryUser)}`,
      )
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].id).toBe(applicationChangeRequest.id);
    expect(response.body.data[0].applicationId).toBe(application.id);
    expect(response.body.data[0].applicationEditStatus).toBe(
      applicationChangeRequest.applicationEditStatus,
    );
    expect(response.body.data[0].note).toBe(applicationChangeRequest.note);
    expect(response.body.data[0].status).toBe(applicationChangeRequest.status);
    expect(response.body.data[0].createdAt).toBe(
      applicationChangeRequest.createdAt,
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
