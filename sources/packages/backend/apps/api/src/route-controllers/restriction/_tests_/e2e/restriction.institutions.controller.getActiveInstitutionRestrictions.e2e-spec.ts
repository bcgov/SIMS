import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeRestriction,
  createFakeInstitutionLocation,
  createFakeEducationProgram,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  RestrictionNotificationType,
  Restriction,
  RestrictionType,
  RestrictionActionType,
  Institution,
  User,
  EducationProgram,
  InstitutionLocation,
  InstitutionRestriction,
} from "@sims/sims-db";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import * as request from "supertest";
import { In } from "typeorm";

describe("RestrictionInstitutionsController(e2e)-getActiveInstitutionRestrictions.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  const testRestrictionCodes = ["INST001", "INST002"];
  const [restrictionCode, restrictionWithNoEffectCode] = testRestrictionCodes;
  const endpoint = "/institutions/restriction/active";
  let restriction: Restriction;
  let restrictionWithNoEffect: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    restriction = await db.restriction.save(
      createFakeRestriction({
        initialValues: {
          restrictionCode,
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
    restrictionWithNoEffect = await db.restriction.save(
      createFakeRestriction({
        initialValues: {
          restrictionCode: restrictionWithNoEffectCode,
          restrictionType: RestrictionType.Institution,
          actionType: [RestrictionActionType.StopPartTimeDisbursement],
          notificationType: RestrictionNotificationType.NoEffect,
        },
      }),
    );
  });

  beforeEach(async () => {
    // Clear institution restrictions created with test restrictions before each test.
    const institutionRestrictions = await db.institutionRestriction.find({
      select: { id: true },
      where: { restriction: { restrictionCode: In(testRestrictionCodes) } },
    });
    if (institutionRestrictions.length) {
      await db.institutionRestriction.delete({
        id: In(institutionRestrictions.map((restriction) => restriction.id)),
      });
    }
  });

  it(
    `Should return active institution restrictions for all the locations excluding the restrictions with notification type ${RestrictionNotificationType.NoEffect}` +
      " when the institution user type is admin.",
    async () => {
      // Arrange
      const { institution, user } = await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
      );
      // Create location, program and institution restrictions for the location and program.
      const { location, program } = await createInstitutionRestrictions(
        [
          { restriction, isActive: true },
          { restriction: restrictionWithNoEffect, isActive: true },
          { restriction, isActive: false },
        ],
        institution,
        user,
      );
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionRestrictions: [
            {
              programId: program.id,
              locationId: location.id,
              restrictionCode,
              restrictionActions: [
                RestrictionActionType.StopPartTimeDisbursement,
                RestrictionActionType.StopFullTimeDisbursement,
                RestrictionActionType.StopOfferingCreate,
              ],
            },
          ],
        });
    },
  );

  it(
    `Should return active institution restrictions for only authorized locations excluding the restrictions with notification type ${RestrictionNotificationType.NoEffect}` +
      " when the institution user type is user.",
    async () => {
      // Arrange
      const { institution, user } = await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeCUser,
      );
      // Create location, program and institution restrictions for the location and program.
      const { location: authorizedLocation, program } =
        await createInstitutionRestrictions(
          [
            { restriction, isActive: true },
            { restriction: restrictionWithNoEffect, isActive: true },
            { restriction, isActive: false },
          ],
          institution,
          user,
        );
      // Authorize the institution user for the created location.
      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeCUser,
        authorizedLocation,
      );
      // Create another location which is not authorized and institution restriction which should not be returned.
      await createInstitutionRestrictions(
        [{ restriction, isActive: true }],
        institution,
        user,
      );
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionRestrictions: [
            {
              programId: program.id,
              locationId: authorizedLocation.id,
              restrictionCode,
              restrictionActions: [
                RestrictionActionType.StopPartTimeDisbursement,
                RestrictionActionType.StopFullTimeDisbursement,
                RestrictionActionType.StopOfferingCreate,
              ],
            },
          ],
        });
    },
  );

  it("Should return no active institution restrictions when there are no institution restrictions present for the institution.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        institutionRestrictions: [],
      });
  });

  /**
   * Create institution restrictions.
   * @param restrictionInputs restriction inputs.
   * @param institution institution.
   * @param user institution user.
   * @returns institution restrictions with location and program.
   */
  async function createInstitutionRestrictions(
    restrictionInputs: {
      restriction: Restriction;
      isActive?: boolean;
    }[],
    institution: Institution,
    user: User,
  ): Promise<{
    location: InstitutionLocation;
    program: EducationProgram;
    institutionRestrictions: InstitutionRestriction[];
  }> {
    const location = await db.institutionLocation.save(
      createFakeInstitutionLocation({ institution }),
    );
    const program = await db.educationProgram.save(
      createFakeEducationProgram({ auditUser: user, institution }),
    );
    const institutionRestrictionPromises = [];
    for (const restrictionInput of restrictionInputs) {
      institutionRestrictionPromises.push(
        saveFakeInstitutionRestriction(
          db,
          {
            institution,
            location,
            program,
            restriction: restrictionInput.restriction,
          },
          { initialValues: { isActive: restrictionInput.isActive } },
        ),
      );
    }
    const institutionRestrictions = await Promise.all(
      institutionRestrictionPromises,
    );
    return { location, program, institutionRestrictions };
  }

  afterAll(async () => {
    await app?.close();
  });
});
