import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  RestrictionCode,
  createE2EDataSources,
  saveFakeDesignationAgreementLocation,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import { RestrictionType } from "@sims/sims-db";

describe("InstitutionLocationStudentsController(e2e)-getOptionsList", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the list of all designated institution locations which should contains the newly created designated location and not the newly created non designated location when student requests all locations.", async () => {
    // Arrange
    const newDesignation = await saveFakeDesignationAgreementLocation(db, {
      numberOfLocations: 2,
    });
    const [designatedLocation, nonDesignatedLocation] =
      newDesignation.designationAgreementLocations;
    // Setting the designation statuses.
    designatedLocation.approved = true;
    nonDesignatedLocation.approved = false;

    await db.designationAgreementLocation.save([
      designatedLocation,
      nonDesignatedLocation,
    ]);

    const endpoint = "/students/location/options-list";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: designatedLocation.institutionLocation.id,
              description: designatedLocation.institutionLocation.name,
            }),
            expect.not.objectContaining({
              id: nonDesignatedLocation.institutionLocation.id,
              description: nonDesignatedLocation.institutionLocation.name,
            }),
          ]),
        );
      });
  });

  it("Should get the list of all designated institution locations excluding the location that belongs to an institution under review when student requests all locations.", async () => {
    // Arrange
    // Create two distinct designation agreements, to have two distinct institutions,
    // one of them will be under review (IUR).
    const [newDesignation, newDesignationIUR] = await Promise.all([
      saveFakeDesignationAgreementLocation(db, {
        numberOfLocations: 1,
      }),
      saveFakeDesignationAgreementLocation(db, {
        numberOfLocations: 1,
      }),
    ]);
    const [designatedLocation] = newDesignation.designationAgreementLocations;
    const [underReviewLocation] =
      newDesignationIUR.designationAgreementLocations;

    // Associate the IUR restriction to the institution under review location.
    const iurRestriction = await db.restriction.findOneOrFail({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
        restrictionCode: RestrictionCode.IUR,
      },
    });
    await saveFakeInstitutionRestriction(db, {
      restriction: iurRestriction,
      institution: underReviewLocation.institutionLocation.institution,
    });

    const endpoint = "/students/location/options-list";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: designatedLocation.institutionLocation.id,
              description: designatedLocation.institutionLocation.name,
            }),
            expect.not.objectContaining({
              id: underReviewLocation.institutionLocation.id,
              description: underReviewLocation.institutionLocation.name,
            }),
          ]),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
