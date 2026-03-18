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

  it("Should not return the institution code property when no code is assigned.", async () => {
    // Arrange
    // Create a location without an institution code to simulate locations
    // submitted with the "I do not have an institution location code" option selected.
    const location = createFakeInstitutionLocation();
    location.institutionCode = undefined;
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

  it("Should return institution location with all fields when an institution code is assigned.", async () => {
    // Arrange
    const savedLocation = await db.institutionLocation.save(
      createFakeInstitutionLocation(),
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocation.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        locationName: savedLocation.name,
        institutionCode: savedLocation.institutionCode,
        primaryContactFirstName: savedLocation.primaryContact.firstName,
        primaryContactLastName: savedLocation.primaryContact.lastName,
        primaryContactEmail: savedLocation.primaryContact.email,
        primaryContactPhone: savedLocation.primaryContact.phone,
        addressLine1: savedLocation.data.address.addressLine1,
        provinceState: savedLocation.data.address.provinceState,
        country: savedLocation.data.address.country,
        city: savedLocation.data.address.city,
        postalCode: savedLocation.data.address.postalCode,
        canadaPostalCode: savedLocation.data.address.postalCode,
        selectedCountry: savedLocation.data.address.selectedCountry,
      });
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
