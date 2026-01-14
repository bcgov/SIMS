import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeRestriction,
  createFakeUser,
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
  User,
} from "@sims/sims-db";

/**
 * E2E test restriction code for tests.
 */
const TEST_INSTITUTION_RESTRICTION_CODE = "INST001M";

describe("RestrictionAESTController(e2e)-getActiveInstitutionRestrictions.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let restriction: Restriction;
  let user: User;

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
    user = await db.user.save(createFakeUser());
  });

  it("Should return active institution restrictions for the institution when institution has one or more active restrictions.", async () => {
    // Arrange
    // Using the offering factory to create institution, location and program.
    const offering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({ auditUser: user }),
    );
    const location = offering.institutionLocation;
    const institution = location.institution;
    const program = offering.educationProgram;
    await saveFakeInstitutionRestriction(db, {
      restriction,
      institution,
      location,
      program,
    });
    const endpoint = `/aest/restriction/institution/${institution.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        institutionRestrictions: [
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
