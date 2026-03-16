import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
} from "@sims/test-utils";

describe("InstitutionLocationAESTController(e2e)-getInstitutionLocation", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should return institution location with a null institution code when none is assigned.", async () => {
    // Arrange
    // Create a location without an institution code to simulate locations
    // submitted with the "I do not have an institution location code" option selected.
    const location = createFakeInstitutionLocation();
    location.institutionCode = null;
    const savedLocation = await db.institutionLocation.save(location);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocation.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body.institutionCode).toBeNull();
  });

  it("Should return institution location with the institution code when one is assigned.", async () => {
    // Arrange
    const location = createFakeInstitutionLocation();
    const savedLocation = await db.institutionLocation.save(location);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocation.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body.institutionCode).toBe(savedLocation.institutionCode);
  });

  it("Should return not found when the institution location does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/99999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Institution Location was not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
