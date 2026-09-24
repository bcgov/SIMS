import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeBatchReassessment,
  createFakeUser,
  E2EDataSources,
} from "@sims/test-utils";
import { BatchReassessmentStatus, User } from "@sims/sims-db";
import { Role } from "../../../../auth";

describe("BatchReassessmentAESTController(e2e)-createBatchReassessment", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let savedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    savedUser = await db.user.save(createFakeUser());
  });

  beforeEach(async () => {
    await db.batchReassessmentApplication.deleteAll();
    await db.batchReassessment.deleteAll();
  });

  it("Should create a batch reassessment when requested by an authorized AEST user.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      applicationNumbers: ["1000000001"],
      note: "Batch reassessment test.",
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED);

    const batches = await db.batchReassessment.find();
    expect(batches).toHaveLength(1);
    expect(batches[0].status).toBe(BatchReassessmentStatus.Completed);
    expect(batches[0].batchNumber).toBeDefined();
  });

  it("Should return unprocessable entity when a batch reassessment is already in progress.", async () => {
    // Arrange
    const inProgressBatch = createFakeBatchReassessment(
      { creator: savedUser },
      { initialValue: { status: BatchReassessmentStatus.InProgress } },
    );
    await db.batchReassessment.save(inProgressBatch);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        applicationNumbers: ["1000000001"],
        note: "Batch reassessment test.",
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "A batch manual reassessment is already in progress.",
        errorType: "BATCH_REASSESSMENT_ALREADY_IN_PROGRESS",
      });
  });

  it(`Should return forbidden when the AEST user does not have the ${Role.AESTBatchReassessment} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        applicationNumbers: ["1000000001"],
        note: "Batch reassessment test.",
      })
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

function getEndpoint(): string {
  return "/aest/batch-reassessment";
}
