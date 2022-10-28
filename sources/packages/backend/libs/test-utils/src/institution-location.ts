import { Institution, InstitutionLocation } from "@sims/sims-db";
import * as faker from "faker";

export function createFakeInstitutionLocation(
  institution: Institution,
): InstitutionLocation {
  const institutionLocation = new InstitutionLocation();

  institutionLocation.name = faker.company.companyName();
  institutionLocation.institution = institution;
  institutionLocation.data = {
    address: {
      addressLine1: faker.address.streetAddress(),
      city: "Victoria",
      provinceState: "BC",
      country: "canada",
      postalCode: faker.address.zipCode("A9A9A9"),
    },
  };
  institutionLocation.primaryContact = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
  };
  return institutionLocation;
}

export function multipleFakeInstitutionLocations(
  institution: Institution,
  count: number,
): InstitutionLocation[] {
  const institutionLocation: InstitutionLocation[] = [];
  for (let i = 0; i < count; i++) {
    institutionLocation.push(createFakeInstitutionLocation(institution));
  }
  return institutionLocation;
}
