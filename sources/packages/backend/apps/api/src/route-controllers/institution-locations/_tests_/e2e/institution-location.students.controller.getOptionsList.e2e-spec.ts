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
  });

  it("Should get the list of all designated institution location which should contain the only newly created designated location and not the newly created non designated location when student requests.", async () => {
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

  afterAll(async () => {
    await app?.close();
  });
});
