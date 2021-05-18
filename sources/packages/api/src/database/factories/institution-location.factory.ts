import * as faker from "faker";
import { InstitutionLocation } from "../entities/institution-location.model";
export async function institutionLocationFactory(
  incoming?: Partial<InstitutionLocation>,
): Promise<InstitutionLocation> {
  const loc = new InstitutionLocation();

  loc.name = incoming?.name || faker.company.companyName();
  loc.institution = incoming?.institution;
  loc.data = incoming?.data || {
    address: {
      addressLine1: faker.address.streetAddress(),
      city: "Victoria",
      province: "bc",
      country: "CA",
      postalCode: "V8V1M7",
    },
  };
  return loc;
}
