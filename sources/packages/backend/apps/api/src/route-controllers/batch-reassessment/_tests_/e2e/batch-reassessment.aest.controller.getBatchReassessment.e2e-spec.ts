import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchReassessment,
  createFakeBatchReassessmentApplication,
  createFakeUser,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import {
  BatchReassessmentApplicationResult,
  BatchReassessmentStatus,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("BatchReassessmentAESTController(e2e)-getBatchReassessment", () => {
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
    // Clear the relevant tables before each test since all data is queried.
    await db.batchReassessmentApplication.deleteAll();
    await db.batchReassessment.deleteAll();
  });

  it("Should return batch reassessments when requested by an authorized AEST user.", async () => {
    // Arrange
    // Create two batches to be returned in createdAt DESC order.
    const now = new Date();
    const newerBatch = createFakeBatchReassessment(
      { creator: savedUser },
      {
        initialValue: {
          createdAt: now,
          status: BatchReassessmentStatus.InProgress,
        },
      },
    );
    await db.batchReassessment.save(newerBatch);

    const olderBatch = createFakeBatchReassessment(
      { creator: savedUser },
      {
        initialValue: {
          createdAt: addDays(-1, now),
          status: BatchReassessmentStatus.Completed,
        },
      },
    );
    await db.batchReassessment.save(olderBatch);
    const olderBatchApp1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: olderBatch,
        applicationNumber: "1000000001",
        creator: savedUser,
      },
      { initialValue: { result: BatchReassessmentApplicationResult.Success } },
    );
    await db.batchReassessmentApplication.save(olderBatchApp1);

    const newerBatchApp1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: newerBatch,
        applicationNumber: "1000000002",
        creator: savedUser,
      },
      { initialValue: { result: BatchReassessmentApplicationResult.Success } },
    );
    await db.batchReassessmentApplication.save(newerBatchApp1);
    const newerBatchApp2 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: newerBatch,
        applicationNumber: "1000000003",
        creator: savedUser,
      },
      { initialValue: { result: BatchReassessmentApplicationResult.Failure } },
    );
    await db.batchReassessmentApplication.save(newerBatchApp2);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            batchId: newerBatch.id,
            batchNumber: newerBatch.batchNumber,
            createdAt: newerBatch.createdAt.toISOString(),
            creatorFirstName: newerBatch.creator.firstName,
            creatorLastName: newerBatch.creator.lastName,
            successCount: 1,
            failureCount: 1,
            status: newerBatch.status,
          },
          {
            batchId: olderBatch.id,
            batchNumber: olderBatch.batchNumber,
            createdAt: olderBatch.createdAt.toISOString(),
            creatorFirstName: olderBatch.creator.firstName,
            creatorLastName: olderBatch.creator.lastName,
            successCount: 1,
            failureCount: 0,
            status: olderBatch.status,
          },
        ]),
      );
  });

  it(`Should throw a HttpStatus Forbidden (403) error when the AEST user does not have the ${Role.AESTBatchReassessment} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
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

/**
 * Gets the endpoint for batch reassessment for AEST users.
 * @returns the endpoint for batch reassessment for AEST users.
 */
function getEndpoint(): string {
  return "/aest/batch-reassessment";
}
