import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { RestrictionType } from "@sims/sims-db";

/**
 * E2E test restriction category used for tests.
 * Allows to isolate test data.
 */
const E2E_RESTRICTION_CATEGORY = "E2E Test Category";

describe("RestrictionAESTController(e2e)-getReasonsOptionsList.", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    // Clean restrictions table before each test.
    await db.restriction.delete({
      restrictionCategory: E2E_RESTRICTION_CATEGORY,
    });
  });

  describe("Should get reasons options list for a restriction type when the request is valid.", () => {
    for (const restrictionType of [
      RestrictionType.Provincial,
      RestrictionType.Institution,
    ]) {
      it(`Should get ${restrictionType} restrictions reasons list filtered by specific category when ${restrictionType} restrictions are requested for a category.`, async () => {
        // Arrange
        const e2eTestRestriction = createFakeRestriction({
          initialValues: {
            restrictionType: restrictionType,
            restrictionCategory: E2E_RESTRICTION_CATEGORY,
          },
        });
        await db.restriction.save(e2eTestRestriction);
        const endpoint = `/aest/restriction/reasons?type=${restrictionType}&category=${E2E_RESTRICTION_CATEGORY}`;
        const token = await getAESTToken(AESTGroups.BusinessAdministrators);

        // Act/Assert
        await request(app.getHttpServer())
          .get(endpoint)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK)
          .expect([
            {
              id: e2eTestRestriction.id,
              description: `${e2eTestRestriction.restrictionCode} - ${e2eTestRestriction.description}`,
            },
          ]);
      });
    }
  });

  it("Should throw a bad request exception when requesting federal restrictions reasons.", async () => {
    // Arrange
    const endpoint = `/aest/restriction/reasons?type=${RestrictionType.Federal}&category=someCategory`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "type must be one of the following values: Provincial, Institution",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request exception when category is not provided.", async () => {
    // Arrange
    const endpoint = `/aest/restriction/reasons?type=${RestrictionType.Provincial}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["category must be shorter than or equal to 50 characters"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
