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
import {
  ApplicationStatus,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { BatchReassessmentStatus } from "../../../../services/batch-reassessment/batch-reassessment.service.models";

describe("BatchReassessmentAESTController(e2e)-getBatchReassessments", () => {
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

  it("Should return a Completed batch reassessment with correct counts when one application succeeds and one fails.", async () => {
    // Arrange
    const now = new Date();

    // Batch has 1 success (Completed assessment) and 1 failure (Application not found).
    const application = await saveFakeApplication(db.dataSource);
    const batch = createFakeBatchReassessment(
      { creator: auditUser },
      {
        initialValue: {
          createdAt: now,
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

    const batchApplication1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: application.applicationNumber,
        studentAssessment: reassessment,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batchApplication1);

    const batchApplication2 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: "1234567890",
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batchApplication2);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            id: batch.id,
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

  it("Should return a Completed batch reassessment with correct counts when the assessment was cancelled.", async () => {
    // Arrange
    const now = new Date();

    // Batch has an application with an assessment that was subsequently Cancelled.
    // We need to ensure that it is counted as a Success since the assessment ran to completion.
    const application = await saveFakeApplication(
      db.dataSource,
      {},
      {
        applicationStatus: ApplicationStatus.Cancelled,
        currentAssessmentInitialValues: {
          studentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      },
    );
    const batch = createFakeBatchReassessment(
      { creator: auditUser },
      {
        initialValue: {
          createdAt: now,
        },
      },
    );
    await db.batchReassessment.save(batch);

    const reassessment = createFakeStudentAssessment(
      { auditUser, application },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.Cancelled,
        },
      },
    );
    await db.studentAssessment.save(reassessment);

    const batchApplication1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: application.applicationNumber,
        studentAssessment: reassessment,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batchApplication1);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            id: batch.id,
            batchNumber: batch.batchNumber,
            createdAt: batch.createdAt.toISOString(),
            creatorFirstName: batch.creator.firstName,
            creatorLastName: batch.creator.lastName,
            failureCount: 0,
            successCount: 1,
            totalCount: 1,
            status: BatchReassessmentStatus.Completed,
          },
        ]),
      );
  });

  it("Should return an In progress batch reassessment when one application is pending and one fails.", async () => {
    // Arrange
    const now = new Date();

    // Batch has 1 pending (Assessment submitted) and 1 failure (Archived application).
    const batch = createFakeBatchReassessment(
      { creator: auditUser },
      {
        initialValue: {
          createdAt: now,
        },
      },
    );
    await db.batchReassessment.save(batch);

    const application = await saveFakeApplication(db.dataSource);
    const reassessment = createFakeStudentAssessment({
      auditUser,
      application,
    });
    await db.studentAssessment.save(reassessment);

    const batchApplication1 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: application.applicationNumber,
        studentAssessment: reassessment,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batchApplication1);

    const archivedApplication = await saveFakeApplication(
      db.dataSource,
      {},
      { initialValues: { isArchived: true } },
    );
    const batchApplication2 = createFakeBatchReassessmentApplication(
      {
        batchReassessment: batch,
        applicationNumber: archivedApplication.applicationNumber,
        creator: auditUser,
      },
      {},
    );
    await db.batchReassessmentApplication.save(batchApplication2);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            id: batch.id,
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
