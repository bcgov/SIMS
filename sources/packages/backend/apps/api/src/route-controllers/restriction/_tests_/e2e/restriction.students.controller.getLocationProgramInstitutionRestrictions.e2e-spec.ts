import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeEducationProgram,
  createFakeInstitution,
  createFakeInstitutionLocation,
  createFakeRestriction,
  createFakeUser,
  E2EDataSources,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  InstitutionRestriction,
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";

describe("RestrictionStudentsController(e2e)-getLocationProgramInstitutionRestrictions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let noEffectProgramLocationRestriction: Restriction;
  let errorProgramLocationRestriction: Restriction;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    noEffectProgramLocationRestriction = await db.restriction.save(
      createFakeRestriction({
        initialValues: {
          restrictionType: RestrictionType.Institution,
          actionType: [
            RestrictionActionType.StopPartTimeDisbursement,
            RestrictionActionType.StopFullTimeDisbursement,
          ],
          notificationType: RestrictionNotificationType.NoEffect,
        },
      }),
    );
    errorProgramLocationRestriction = await db.restriction.save(
      createFakeRestriction({
        initialValues: {
          restrictionType: RestrictionType.Institution,
          actionType: [
            RestrictionActionType.StopPartTimeDisbursement,
            RestrictionActionType.StopFullTimeDisbursement,
          ],
          notificationType: RestrictionNotificationType.Error,
        },
      }),
    );
  });

  it(
    "Should get the active institution restrictions which are effective for the given program and institution location" +
      ` when there is one or more active institution restrictions for the provided program and institution location with notification type not as ${RestrictionNotificationType.NoEffect}.`,
    async () => {
      // Arrange
      const institutionRestriction = await createInstitutionRestriction(
        errorProgramLocationRestriction,
      );
      // Endpoint with location and program.
      const endpoint = `/students/restriction/institution/location/${institutionRestriction.location.id}/program/${institutionRestriction.program.id}`;

      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionRestrictions: [
            {
              restrictionActions: [
                RestrictionActionType.StopPartTimeDisbursement,
                RestrictionActionType.StopFullTimeDisbursement,
              ],
            },
          ],
        });
    },
  );

  it(
    "Should get no institution restrictions for the given program and institution location" +
      ` when there is one or more active institution restrictions for the provided program and institution location with notification type as ${RestrictionNotificationType.NoEffect}.`,
    async () => {
      // Arrange
      const institutionRestriction = await createInstitutionRestriction(
        noEffectProgramLocationRestriction,
      );
      // Endpoint with location and program.
      const endpoint = `/students/restriction/institution/location/${institutionRestriction.location.id}/program/${institutionRestriction.program.id}`;

      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionRestrictions: [],
        });
    },
  );

  it(
    "Should get no institution restrictions for the given program and institution location" +
      " when there are no active institution restrictions for the provided program and institution location.",
    async () => {
      // Arrange
      // Create institution, location and program.
      const [user, institution] = await Promise.all([
        db.user.save(createFakeUser()),
        db.institution.save(createFakeInstitution()),
      ]);
      const [location, program] = await Promise.all([
        db.institutionLocation.save(
          createFakeInstitutionLocation({ institution }),
        ),
        db.educationProgram.save(
          createFakeEducationProgram({
            auditUser: user,
            institution,
          }),
        ),
      ]);

      // Endpoint with location and program.
      const endpoint = `/students/restriction/institution/location/${location.id}/program/${program.id}`;

      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          institutionRestrictions: [],
        });
    },
  );

  it("Should throw a not found exception when no institution is found with the provided location and program.", async () => {
    // Arrange

    // Endpoint with invalid location and program.
    const endpoint =
      "/students/restriction/institution/location/99999/program/99999";

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Institution with the program and location not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  /**
   * Create institution restriction.
   * @returns Institution restriction.
   */
  async function createInstitutionRestriction(
    restriction: Restriction,
  ): Promise<InstitutionRestriction> {
    return saveFakeInstitutionRestriction(
      db,
      {
        restriction,
      },
      { createProgram: true, createLocation: true },
    );
  }

  afterAll(async () => {
    await app?.close();
  });
});
