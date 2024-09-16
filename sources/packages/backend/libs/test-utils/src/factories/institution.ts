import * as faker from "faker";
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
  institution.businessGuid = faker.datatype.uuid();
  institution.legalOperatingName = faker.company.companyName();
  institution.operatingName = faker.company.companySuffix();
  institution.primaryPhone = faker.phone.phoneNumber("##########");
  institution.primaryEmail = faker.internet.email();
  institution.website = faker.internet.url();
  institution.regulatingBody = "icbc";
  institution.establishedDate = faker.date.past(20).toISOString();
  institution.institutionType =
    relations?.institutionType ??
    ({
      id: INSTITUTION_TYPE_BC_PRIVATE,
    } as InstitutionType);
  institution.institutionPrimaryContact = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber("##########"),
  };
  institution.institutionAddress = {
    mailingAddress: {
      addressLine1: faker.address.streetAddress(),
      addressLine2: faker.address.secondaryAddress(),
      provinceState: "BC",
      country: "canada",
      selectedCountry: "Canada",
      city: "Victoria",
      postalCode: faker.address.zipCode("A9A9A9"),
    },
  };
  return institution;
}
