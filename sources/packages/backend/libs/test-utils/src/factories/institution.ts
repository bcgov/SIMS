import { faker } from "@faker-js/faker";
import { Institution, InstitutionType } from "@sims/sims-db";
import { INSTITUTION_TYPE_BC_PRIVATE } from "@sims/sims-db/constant";

/**
 * Create fake institution.
 * @param relations institution relations.
 * - `institutionType` institution type.
 * @returns institution.
 */
export function createFakeInstitution(relations?: {
  institutionType?: InstitutionType;
}): Institution {
  const institution = new Institution();
  institution.businessGuid = faker.string.uuid();
  institution.legalOperatingName = faker.company.name();
  institution.operatingName = faker.company.name();
  institution.primaryPhone = faker.phone.number({ style: "national" });
  institution.primaryEmail = faker.internet.email();
  institution.website = faker.internet.url();
  institution.regulatingBody = "icbc";
  institution.establishedDate = faker.date.past({ years: 20 }).toISOString();
  institution.institutionType =
    relations?.institutionType ??
    ({
      id: INSTITUTION_TYPE_BC_PRIVATE,
    } as InstitutionType);
  institution.institutionPrimaryContact = {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.number({ style: "national" }),
  };
  institution.institutionAddress = {
    mailingAddress: {
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      provinceState: "BC",
      country: "canada",
      selectedCountry: "Canada",
      city: "Victoria",
      postalCode: faker.location.zipCode("A9A9A9"),
    },
  };
  return institution;
}
