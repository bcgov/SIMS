import { OfferingIntensity, RelationshipStatus } from "@sims/sims-db";
import { MSFAATestInputData } from "./msfaa-helper";

export const MSFAA_FULL_TIME_MARRIED: MSFAATestInputData = {
  msfaaNumber: "2000",
  sin: "900000000",
  institutionCode: "ABCD",
  birthDate: "1995-06-30",
  surname: "Doe",
  givenName: "John",
  gender: "male",
  maritalStatus: RelationshipStatus.Married,
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "Calgary",
  provinceState: "AB",
  postalCode: "H1H 1H1",
  country: "Canada",
  phone: "1111111111",
  email: "john.doe@somedomain.com",
  offeringIntensity: OfferingIntensity.fullTime,
};
