import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  createFakeUser,
  E2EDataSources,
  RestrictionCode,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import { InstitutionRestriction, RestrictionActionType } from "@sims/sims-db";

describe("RestrictionStudentsController(e2e)-getLocationProgramInstitutionRestrictions", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it(
    "Should get the active institution restrictions which are effective for the given program and institution location" +
      " when there is one or more active institution restrictions for the provided program and institution location.",
    async () => {
      // Arrange
      const institutionRestriction = await createInstitutionRestriction();
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
                RestrictionActionType.StopOfferingCreate,
              ],
            },
          ],
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
  async function createInstitutionRestriction(): Promise<InstitutionRestriction> {
    const restriction = await db.restriction.findOne({
      select: { id: true, restrictionCode: true, actionType: true },
      where: { restrictionCode: RestrictionCode.SUS },
    });
    return saveFakeInstitutionRestriction(db, {
      restriction,
    });
  }

  afterAll(async () => {
    await app?.close();
  });
});
