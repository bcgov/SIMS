import * as faker from "faker";
import { Institution, InstitutionType } from "../entities";

export async function institutionFactory(
  incoming?: Partial<Institution>,
): Promise<Institution> {
  const institution = new Institution();
  institution.legalOperatingName = faker.company.companyName();
  institution.operatingName = institution.legalOperatingName;
  institution.guid = faker.random.uuid();
  institution.establishedDate = faker.date.past();
  institution.website = faker.internet.url();
  institution.institutionType = {
    id: 1,
    name: "BC Private",
  } as InstitutionType;
  institution.institutionAddress = {
    mailingAddress: {
      addressLine1: faker.address.streetAddress(),
      city: "Victoria",
      country: "Canada",
      postalCode: "V8V1M9",
      provinceState: "BC",
    },
  };
  institution.primaryEmail = faker.internet.email();
  institution.primaryPhone = faker.phone.phoneNumber();
  institution.institutionPrimaryContact = {
    email: faker.internet.email(),
    lastName: faker.name.lastName(),
    firstName: faker.name.firstName(),
    phone: faker.phone.phoneNumber(),
  };
  institution.regulatingBody = "ICBC";
  institution.users = incoming?.users;
  return institution;
}
