import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchRestriction,
  createFakeBatchRestrictionStudent,
  createFakeRestriction,
  createFakeUser,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import { Restriction, User } from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";
import { addDays } from "@sims/utilities/date-utils";

describe("RestrictionAESTController(e2e)-getBatchRestrictions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let auditUser: User;
  let provincialRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    auditUser = await db.user.save(createFakeUser());
    provincialRestriction = await db.restriction.save(createFakeRestriction());
  });

  it("Should return a batch restriction with correct counts when one student succeeds and one fails.", async () => {
    // Arrange
    const now = new Date();

    // Batch has 1 success (student found) and 1 failure (application number not found).
    const student = await saveFakeStudent(db.dataSource);
    const batch = createFakeBatchRestriction(
      { restriction: provincialRestriction, creator: auditUser },
      { initialValues: { createdAt: now } },
    );
    await db.batchRestriction.save(batch);

    const successfulBatchStudent = createFakeBatchRestrictionStudent({
      batchRestriction: batch,
      identifier: "1234567891",
      student,
      creator: auditUser,
    });
    const failedBatchStudent = createFakeBatchRestrictionStudent(
      {
        batchRestriction: batch,
        identifier: "1234567890",
        creator: auditUser,
      },
      {
        initialValues: {
          failureReason: "The application number does not exist.",
        },
      },
    );
    await db.batchRestrictionStudent.save([
      successfulBatchStudent,
      failedBatchStudent,
    ]);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual(
          expect.arrayContaining([
            {
              id: batch.id,
              batchNumber: batch.batchNumber,
              createdAt: batch.createdAt.toISOString(),
              creatorName: getUserFullName(batch.creator),
              restrictionCode: provincialRestriction.restrictionCode,
              restrictionDescription: provincialRestriction.description,
              totalCount: 2,
              successCount: 1,
              failureCount: 1,
            },
          ]),
        ),
      );
  });

  it("Should return batch restrictions ordered by most recent batch first when multiple batches exist.", async () => {
    // Arrange
    const now = new Date();
    const olderBatch = createFakeBatchRestriction(
      { restriction: provincialRestriction, creator: auditUser },
      { initialValues: { createdAt: addDays(-1, now) } },
    );
    const newerBatch = createFakeBatchRestriction(
      { restriction: provincialRestriction, creator: auditUser },
      { initialValues: { createdAt: now } },
    );
    await db.batchRestriction.save([olderBatch, newerBatch]);

    const batchStudents = [olderBatch, newerBatch].map((batch) =>
      createFakeBatchRestrictionStudent(
        {
          batchRestriction: batch,
          identifier: "1234567890",
          creator: auditUser,
        },
        {
          initialValues: {
            failureReason: "The application number does not exist.",
          },
        },
      ),
    );
    await db.batchRestrictionStudent.save(batchStudents);

    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) => {
        const expectedIds = [newerBatch.id, olderBatch.id];
        const returnedIds = body
          .map((batch: { id: number }) => batch.id)
          .filter((id: number) => expectedIds.includes(id));
        expect(returnedIds).toEqual(expectedIds);
      });
  });

  it(`Should throw a HttpStatus Forbidden (403) error when the AEST user does not have the ${Role.AESTBatchRestriction} role.`, async () => {
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
 * Gets the endpoint for batch restrictions for AEST users.
 * @returns the endpoint for batch restrictions for AEST users.
 */
function getEndpoint(): string {
  return "/aest/restriction/student/batch";
}
