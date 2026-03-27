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
import { DUPLICATE_INSTITUTION_LOCATION_CODE } from "../../../../constants";

describe("InstitutionLocationAESTController(e2e)-update", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should update all institution location fields and persist them correctly.", async () => {
    // Arrange
    const location = createFakeInstitutionLocation();
    const savedLocation = await db.institutionLocation.save(location);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocation.id}`;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        locationName: "Updated Location Name",
        institutionCode: "UPDT",
        primaryContactFirstName: "John",
        primaryContactLastName: "Doe",
        primaryContactEmail: "john.doe@testmail.com",
        primaryContactPhone: "(250) 555-1234",
        addressLine1: "123 Updated Street",
        city: "Vancouver",
        country: "canada",
        postalCode: "B1B1B1",
        selectedCountry: "Canada",
        provinceState: "BC",
        canadaPostalCode: "B1B1B1",
      })
      .expect(HttpStatus.OK);

    // Assert
    const updatedLocation = await db.institutionLocation.findOne({
      select: {
        id: true,
        name: true,
        institutionCode: true,
        data: true,
        primaryContact: true,
      },
      where: { id: savedLocation.id },
    });
    expect(updatedLocation).toEqual({
      id: savedLocation.id,
      name: "Updated Location Name",
      institutionCode: "UPDT",
      data: {
        address: {
          addressLine1: "123 Updated Street",
          city: "Vancouver",
          country: "canada",
          postalCode: "B1B1B1",
          selectedCountry: "Canada",
          provinceState: "BC",
        },
      },
      primaryContact: {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@testmail.com",
        phone: "(250) 555-1234",
      },
    });
  });

  it("Should save institution location with null code when an empty institution code is submitted.", async () => {
    // Arrange
    const location = createFakeInstitutionLocation();
    const savedLocation = await db.institutionLocation.save(location);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocation.id}`;
    const address = savedLocation.data.address;

    // Act
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        locationName: savedLocation.name,
        institutionCode: "",
        primaryContactFirstName: savedLocation.primaryContact.firstName,
        primaryContactLastName: savedLocation.primaryContact.lastName,
        primaryContactEmail: savedLocation.primaryContact.email,
        primaryContactPhone: savedLocation.primaryContact.phone,
        addressLine1: address.addressLine1,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode,
        selectedCountry: address.selectedCountry,
        provinceState: address.provinceState,
        canadaPostalCode: address.postalCode,
      })
      .expect(HttpStatus.OK);

    // Assert
    const updatedLocation = await db.institutionLocation.findOneBy({
      id: savedLocation.id,
    });
    expect(updatedLocation.institutionCode).toBeNull();
  });

  it("Should return unprocessable entity when trying to update with a code already assigned to another location in the same institution.", async () => {
    // Arrange
    // Create two locations for the same institution so both share the same institutionCode conflict check scope.
    const locationA = createFakeInstitutionLocation();
    const savedLocationA = await db.institutionLocation.save(locationA);
    const locationB = createFakeInstitutionLocation({
      institution: savedLocationA.institution,
    });
    const savedLocationB = await db.institutionLocation.save(locationB);
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/location/${savedLocationB.id}`;
    const address = savedLocationB.data.address;

    // Act/Assert — attempt to assign locationA's code to locationB.
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .send({
        locationName: savedLocationB.name,
        institutionCode: savedLocationA.institutionCode,
        primaryContactFirstName: savedLocationB.primaryContact.firstName,
        primaryContactLastName: savedLocationB.primaryContact.lastName,
        primaryContactEmail: savedLocationB.primaryContact.email,
        primaryContactPhone: savedLocationB.primaryContact.phone,
        addressLine1: address.addressLine1,
        city: address.city,
        country: address.country,
        postalCode: address.postalCode,
        selectedCountry: address.selectedCountry,
        provinceState: address.provinceState,
        canadaPostalCode: address.postalCode,
      })
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Duplicate institution location code.",
        errorType: DUPLICATE_INSTITUTION_LOCATION_CODE,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
