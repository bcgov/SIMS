import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeBatchRestriction,
  createFakeRestriction,
  createFakeUser,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { Role } from "../../../../auth";
import { Restriction, User } from "@sims/sims-db";

describe("BatchRestrictionAESTController(e2e)-getBatchRestriction", () => {
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

  it("Should return the batch restriction details when the batch restriction exists.", async () => {
    // Arrange
    const batch = await db.batchRestriction.save(
      createFakeBatchRestriction({
        restriction: provincialRestriction,
        creator: auditUser,
      }),
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ batchRestrictionId: batch.id }))
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: batch.id,
        batchNumber: batch.batchNumber,
        restrictionCode: provincialRestriction.restrictionCode,
        restrictionDescription: provincialRestriction.description,
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when the batch restriction does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ batchRestrictionId: 99999999 }))
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Batch restriction with ID 99999999 not found.",
        error: "Not Found",
      });
  });

  it(`Should throw a HttpStatus Forbidden (403) error when the AEST user does not have the ${Role.AESTBatchRestriction} role.`, async () => {
    // Arrange
    const token = await getAESTToken();

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ batchRestrictionId: 1 }))
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
 * Gets the endpoint for a batch restriction for AEST users.
 * @param options endpoint options.
 * - `batchRestrictionId` batch restriction ID.
 * @returns the endpoint for a batch restriction.
 */
function getEndpoint(options: { batchRestrictionId: number }): string {
  return `/aest/batch-restriction/${options.batchRestrictionId}`;
}
