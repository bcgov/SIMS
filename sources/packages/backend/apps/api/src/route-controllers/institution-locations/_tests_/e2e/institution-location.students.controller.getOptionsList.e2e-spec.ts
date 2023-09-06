import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeDesignationAgreementLocation,
} from "@sims/test-utils";

describe("InstitutionLocationStudentsController(e2e)-getOptionsList", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Before running the test, making the existing location as non designated.
    await db.designationAgreementLocation.update(
      { approved: true },
      { approved: false },
    );
  });

  it("Should get the list of all designated institution location when student requests.", async () => {
    // Arrange
    const designatedLocations = await saveFakeDesignationAgreementLocation(db, {
      noOfLocations: 2,
    });
    let nonDesignatedLocations = await saveFakeDesignationAgreementLocation(
      db,
      {
        noOfLocations: 1,
      },
    );
    const locations = designatedLocations.map((designatedLocation, index) => ({
      ...designatedLocation.institutionLocation,
      name: `Test Location ${index}`,
    }));
    await db.institutionLocation.save(locations);

    nonDesignatedLocations = nonDesignatedLocations.map(
      (nonDesignatedLocation) => ({
        ...nonDesignatedLocation,
        approved: false,
      }),
    );
    await db.designationAgreementLocation.save(nonDesignatedLocations);

    const endpoint = "/students/location/options-list";
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(
        locations.map((location) => ({
          id: location.id,
          description: location.name,
        })),
      );
  });

  afterAll(async () => {
    await app?.close();
  });
});
