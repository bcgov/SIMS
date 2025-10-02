import { faker } from "@faker-js/faker";
import { Institution, InstitutionLocation } from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

export function createFakeLocation(
  institution?: Institution,
): InstitutionLocation {
  const location = new InstitutionLocation();
  location.data = {
    address: {
      addressLine1: faker.location.streetAddress(),
      addressLine2: faker.location.secondaryAddress(),
      provinceState: "BC",
      country: "CAN",
      city: "Victoria",
      postalCode: faker.location.zipCode("A9A9A9"),
    },
  };
  location.primaryContact = {
    firstName: "FirstName",
    lastName: "LastName",
    email: "Email",
    phone: "Phone",
  };
  location.name = faker.company.name();
  location.institution = institution ?? createFakeInstitution();
  return location;
}
