import { Institution, InstitutionLocation } from "@sims/sims-db";
import { faker } from "@faker-js/faker";
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

  institutionLocation.name = faker.company.name();
  institutionLocation.institution =
    relations?.institution ?? createFakeInstitution();
  institutionLocation.data = {
    address: {
      addressLine1: faker.location.streetAddress(),
      city: "Victoria",
      provinceState: "BC",
      country: "canada",
      selectedCountry: "Canada",
      postalCode: faker.location.zipCode("A9A9A9"),
    },
  };
  institutionLocation.primaryContact = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "national" }),
  };
  institutionLocation.institutionCode =
    options?.initialValue?.institutionCode ??
    faker.string.alpha({
      length: 4,
      casing: "upper",
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
