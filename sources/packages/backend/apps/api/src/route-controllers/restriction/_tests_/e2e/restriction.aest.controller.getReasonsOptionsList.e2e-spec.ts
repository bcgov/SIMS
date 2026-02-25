import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  RestrictionCode,
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
import {
  FieldRequirementType,
  Restriction,
  RestrictionType,
} from "@sims/sims-db";
import { RestrictionAPIOutDTO } from "apps/api/src/route-controllers/restriction/models/restriction.dto";
import { In } from "typeorm";

/**
 * E2E test restriction category used for tests.
 * Allows to isolate test data.
 */
const E2E_RESTRICTION_CATEGORY = "E2E Test Category";

describe("RestrictionAESTController(e2e)-getReasonsOptionsList.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let knownInstitutionRestrictions: Restriction[];

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    knownInstitutionRestrictions = await db.restriction.find({
      select: {
        id: true,
        restrictionCode: true,
        description: true,
        metadata: true,
      },
      where: {
        restrictionType: RestrictionType.Institution,
        restrictionCode: In([RestrictionCode.SUS, RestrictionCode.REMIT]),
      },
    });
  });

  beforeEach(async () => {
    // Clean restrictions table before each test.
    await db.restriction.delete({
      restrictionCategory: E2E_RESTRICTION_CATEGORY,
    });
  });

  describe("Should get reasons options list for a restriction type when the request is valid.", () => {
    for (const restrictionInput of [
      { restrictionType: RestrictionType.Provincial, metadata: undefined },
      {
        restrictionType: RestrictionType.Institution,
        metadata: {
          fieldRequirements: {
            someRequiredField: FieldRequirementType.Required,
            someNotAllowedField: FieldRequirementType.NotAllowed,
          },
        },
      },
    ]) {
      it(`Should get ${restrictionInput.restrictionType} restrictions reasons list filtered by specific category when ${restrictionInput.restrictionType} restrictions are requested for a category.`, async () => {
        // Arrange
        const e2eTestRestriction = createFakeRestriction({
          initialValues: {
            restrictionType: restrictionInput.restrictionType,
            restrictionCategory: E2E_RESTRICTION_CATEGORY,
            metadata: restrictionInput.metadata,
          },
        });
        await db.restriction.save(e2eTestRestriction);
        const endpoint = `/aest/restriction/reasons?type=${restrictionInput.restrictionType}&category=${E2E_RESTRICTION_CATEGORY}`;
        const token = await getAESTToken(AESTGroups.BusinessAdministrators);
        const expectedResultItem: RestrictionAPIOutDTO = {
          id: e2eTestRestriction.id,
          description: `${e2eTestRestriction.restrictionCode} - ${e2eTestRestriction.description}`,
        };
        if (restrictionInput.metadata?.fieldRequirements) {
          expectedResultItem.fieldRequirements =
            restrictionInput.metadata.fieldRequirements;
        }
        // Act/Assert
        await request(app.getHttpServer())
          .get(endpoint)
          .auth(token, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK)
          .expect([expectedResultItem]);
      });
    }
  });

  it(`Should get all the ${RestrictionType.Institution} restrictions reasons list when there is no restriction category filter applied.`, async () => {
    // Arrange
    const endpoint = `/aest/restriction/reasons?type=${RestrictionType.Institution}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const result = response.body;
        expect(result).toEqual(
          expect.arrayContaining(
            knownInstitutionRestrictions.map((restriction) => ({
              id: restriction.id,
              description: `${restriction.restrictionCode} - ${restriction.description}`,
              fieldRequirements: restriction.metadata?.fieldRequirements,
            })),
          ),
        );
      });
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

  afterAll(async () => {
    await app?.close();
  });
});
