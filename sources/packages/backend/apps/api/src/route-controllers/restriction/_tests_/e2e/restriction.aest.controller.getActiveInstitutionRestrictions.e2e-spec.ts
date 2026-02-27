import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeRestriction,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import {
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";

/**
 * E2E test restriction code for tests.
 */
const TEST_INSTITUTION_RESTRICTION_CODE = "INST001M";

describe("RestrictionAESTController(e2e)-getActiveInstitutionRestrictions.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let restriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    restriction = await db.restriction.save(
      createFakeRestriction({
        initialValues: {
          restrictionCode: TEST_INSTITUTION_RESTRICTION_CODE,
          restrictionType: RestrictionType.Institution,
          actionType: [
            RestrictionActionType.StopPartTimeDisbursement,
            RestrictionActionType.StopFullTimeDisbursement,
            RestrictionActionType.StopOfferingCreate,
          ],
          notificationType: RestrictionNotificationType.Error,
        },
      }),
    );
  });

  it("Should return active institution restrictions for the institution when institution has one or more active restrictions.", async () => {
    // Arrange
    const institutionRestriction = await saveFakeInstitutionRestriction(
      db,
      {
        restriction,
      },
      { createProgram: true, createLocation: true },
    );
    const location = institutionRestriction.location;
    const institution = institutionRestriction.institution;
    const program = institutionRestriction.program;
    const endpoint = `/aest/restriction/institution/${institution.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        items: [
          {
            programId: program.id,
            locationId: location.id,
            restrictionCode: TEST_INSTITUTION_RESTRICTION_CODE,
            restrictionActions: [
              RestrictionActionType.StopPartTimeDisbursement,
              RestrictionActionType.StopFullTimeDisbursement,
              RestrictionActionType.StopOfferingCreate,
            ],
          },
        ],
      });
  });

  it("Should throw a not found error when the institution does not exist.", async () => {
    // Arrange
    const endpoint = "/aest/restriction/institution/999999/active";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Institution not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
