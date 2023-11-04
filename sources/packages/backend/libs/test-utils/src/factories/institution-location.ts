import { Institution, InstitutionLocation } from "@sims/sims-db";
import * as faker from "faker";
import { createFakeInstitution } from "./institution";

/**
 * Create fake institution location.
 * @param relations dependencies.
 * - `institution` related institution.
 * @param options dependencies.
 * - `initialValues` initial values.
 * @returns institution location
 */
export function createFakeInstitutionLocation(
  relations?: {
    institution?: Institution;
  },
  options?: {
    initialValue?: Partial<InstitutionLocation>;
  },
): InstitutionLocation {
  const institutionLocation = new InstitutionLocation();

  institutionLocation.name = faker.company.companyName();
  institutionLocation.institution =
    relations?.institution ?? createFakeInstitution();
  institutionLocation.data = {
    address: {
      addressLine1: faker.address.streetAddress(),
      city: "Victoria",
      provinceState: "BC",
      country: "canada",
      selectedCountry: "Canada",
      postalCode: faker.address.zipCode("A9A9A9"),
    },
  };
  institutionLocation.primaryContact = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber("##########"),
  };
  institutionLocation.institutionCode =
    options?.initialValue?.institutionCode ??
    faker.random.alpha({
      count: 4,
      upcase: true,
    });
  institutionLocation.hasIntegration = options?.initialValue?.hasIntegration;
  return institutionLocation;
}

export function createMultipleFakeInstitutionLocations(
  institution: Institution,
  count: number,
): InstitutionLocation[] {
  const institutionLocation: InstitutionLocation[] = [];
  for (let i = 0; i < count; i++) {
    institutionLocation.push(createFakeInstitutionLocation({ institution }));
  }
  return institutionLocation;
}
