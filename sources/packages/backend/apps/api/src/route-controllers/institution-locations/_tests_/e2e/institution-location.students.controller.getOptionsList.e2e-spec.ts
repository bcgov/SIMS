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

  it("Should get the list of all designated institution locations which should contain the newly created designated location and not the newly created non-designated location when a student requests all locations.", async () => {
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
        const locationIds = response.body.map(
          (location: { id: number }) => location.id,
        );
        expect(locationIds).toContain(
          designatedLocation.institutionLocation.id,
        );
        expect(locationIds).not.toContain(
          nonDesignatedLocation.institutionLocation.id,
        );
      });
  });

  it("Should get the list of all designated institution locations, excluding the location that belongs to an institution under review, when a student requests all locations.", async () => {
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
        const locationIds = response.body.map(
          (location: { id: number }) => location.id,
        );
        expect(locationIds).toContain(
          designatedLocation.institutionLocation.id,
        );
        expect(locationIds).not.toContain(
          underReviewLocation.institutionLocation.id,
        );
      });
  });

  it("Should get the list of all designated institution locations, excluding the location that belongs to an institution with activity suspended, when a student requests all locations.", async () => {
    // Arrange
    // Create two distinct designation agreements, to have two distinct institutions,
    // one of them will have activity suspended (ISR).
    const [newDesignation, newDesignationISR] = await Promise.all([
      saveFakeDesignationAgreementLocation(db, {
        numberOfLocations: 1,
      }),
      saveFakeDesignationAgreementLocation(db, {
        numberOfLocations: 1,
      }),
    ]);
    const [designatedLocation] = newDesignation.designationAgreementLocations;
    const [activitySuspendedLocation] =
      newDesignationISR.designationAgreementLocations;

    // Associate the ISR restriction to the institution with activity suspended.
    const isrRestriction = await db.restriction.findOneOrFail({
      select: { id: true },
      where: {
        restrictionType: RestrictionType.Institution,
        restrictionCode: RestrictionCode.ISR,
      },
    });
    await saveFakeInstitutionRestriction(db, {
      restriction: isrRestriction,
      institution: activitySuspendedLocation.institutionLocation.institution,
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
        const locationIds = response.body.map(
          (location: { id: number }) => location.id,
        );
        expect(locationIds).toContain(
          designatedLocation.institutionLocation.id,
        );
        expect(locationIds).not.toContain(
          activitySuspendedLocation.institutionLocation.id,
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
