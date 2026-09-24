import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchReassessment,
  createFakeBatchReassessmentApplication,
  createFakeStudentAssessment,
  createFakeUser,
  saveFakeApplication,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import { StudentAssessmentStatus, User } from "@sims/sims-db";
import { BatchReassessmentStatus } from "../../../../services/batch-reassessment/batch-reassessment.service.models";
import { addDays } from "@sims/utilities";

describe("BatchReassessmentAESTController(e2e)-getBatchReassessment", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    auditUser = await db.user.save(createFakeUser());
  });

  beforeEach(async () => {
    // Clear the tables before each test since all data is queried.
    await db.batchReassessmentApplication.deleteAll();
    await db.batchReassessment.deleteAll();
  });

  it("Should return a Completed batch reassessment when requested by an authorized AEST user.", async () => {
    // Arrange
    const now = new Date();

    // Batch has 1 success (Completed assessment) and 1 failure ("Application not found").
    const application = await saveFakeApplication(db.dataSource, {}, {});
    const batch = createFakeBatchReassessment(
      { creator: auditUser },
      {
        initialValue: {
          createdAt: addDays(-1, now),
        },
      },
    );
    await db.batchReassessment.save(batch);

    const reassessment = createFakeStudentAssessment(
      { auditUser, application },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    await db.studentAssessment.save(reassessment);

    const batch1App1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: application.applicationNumber,
        studentAssessment: reassessment,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batch1App1);

    const batch1App2 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: "1234567890",
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batch1App2);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            createdAt: batch.createdAt.toISOString(),
            creatorFirstName: batch.creator.firstName,
            creatorLastName: batch.creator.lastName,
            successCount: 1,
            failureCount: 1,
            totalCount: 2,
            status: BatchReassessmentStatus.Completed,
          },
        ]),
      );
  });

  it("Should return an In progress batch reassessment when requested by an authorized AEST user.", async () => {
    // Arrange
    const now = new Date();

    // Batch has 1 pending (Assessment in progress) and 1 failure (Archived application).
    const batch = createFakeBatchReassessment(
      { creator: auditUser },
      {
        initialValue: {
          createdAt: now,
        },
      },
    );
    await db.batchReassessment.save(batch);

    const application = await saveFakeApplication(
      db.dataSource,
      {},
      { initialValues: {} },
    );
    const reassessment = createFakeStudentAssessment(
      { auditUser, application },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    await db.studentAssessment.save(reassessment);

    const batch2App1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: application.applicationNumber,
        studentAssessment: reassessment,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batch2App1);

    const archivedApplication = await saveFakeApplication(
      db.dataSource,
      {},
      { initialValues: { isArchived: true } },
    );
    const batch2App2 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: archivedApplication.applicationNumber,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batch2App2);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            createdAt: batch.createdAt.toISOString(),
            creatorFirstName: batch.creator.firstName,
            creatorLastName: batch.creator.lastName,
            successCount: 0,
            failureCount: 1,
            totalCount: 2,
            status: BatchReassessmentStatus.InProgress,
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
