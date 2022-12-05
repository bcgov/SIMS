import * as faker from "faker";
import { Institution, InstitutionLocation } from "@sims/sims-db";
import { createFakeInstitution } from "@sims/test-utils";

export function createFakeLocation(
  institution?: Institution,
): InstitutionLocation {
  const location = new InstitutionLocation();
  location.data = {
    address: {
      addressLine1: faker.address.streetAddress(),
      addressLine2: faker.address.secondaryAddress(),
      provinceState: "BC",
      country: "canada",
      selectedCountry: "Canada",
      city: "Victoria",
      postalCode: faker.address.zipCode("A9A9A9"),
    },
  };
  location.primaryContact = {
    firstName: "FirstName",
    lastName: "LastName",
    email: "Email",
    phone: "Phone",
  };
  location.name = faker.company.companyName();
  location.institution = institution ?? createFakeInstitution();
  return location;
}
