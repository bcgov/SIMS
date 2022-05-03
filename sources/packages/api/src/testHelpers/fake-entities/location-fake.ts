import * as faker from "faker";
import { Institution, InstitutionLocation } from "../../database/entities";
import { createFakeInstitution } from "./institution-fake";

export function createFakeLocation(
  institution?: Institution,
): InstitutionLocation {
  const location = new InstitutionLocation();
  location.data = {
    address: {
      addressLine1: faker.address.streetAddress(),
      addressLine2: faker.address.secondaryAddress(),
      provinceState: "BC",
      country: "CAN",
      city: "Victoria",
      postalCode: faker.address.zipCode("A9A9A9"),
    },
  };
  location.primaryContact = {
    firstName: "FirstName",
    lastName: "LastName",
    email: "Email",
    phoneNumber: "Phone",
  };
  location.name = faker.company.companyName();
  location.institution = institution ?? createFakeInstitution();
  return location;
}
