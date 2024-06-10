import { OfferingIntensity, RelationshipStatus } from "@sims/sims-db";

/**
 * Sample MSFAA Numbers.
 */
export const PART_TIME_SAMPLE_MSFAA_NUMBER = "1000";
export const FULL_TIME_SAMPLE_MSFAA_NUMBER = "2000";

/**
 * Values part of an MSFAA file record.
 */
export interface MSFAATestInputData {
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: string;
  surname: string;
  givenName: string;
  gender: string;
  maritalStatus: RelationshipStatus;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  offeringIntensity: OfferingIntensity;
}

export const MSFAA_PART_TIME_MARRIED: MSFAATestInputData = {
  msfaaNumber: "1000",
  sin: "900000000",
  institutionCode: "ABCD",
  birthDate: "1995-06-30",
  surname: "Doe",
  givenName: "John",
  gender: "man",
  maritalStatus: RelationshipStatus.Married,
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "Calgary",
  provinceState: "AB",
  postalCode: "H1H 1H1",
  country: "Canada",
  phone: "1111111111",
  email: "john.doe@somedomain.com",
  offeringIntensity: OfferingIntensity.partTime,
};

export const MSFAA_PART_TIME_OTHER_COUNTRY: MSFAATestInputData = {
  msfaaNumber: "1001",
  sin: "900000001",
  institutionCode: "EFDG",
  birthDate: "2000-01-01",
  surname: "Other Doe",
  givenName: "Jane",
  gender: "nonBinary",
  maritalStatus: RelationshipStatus.Single,
  addressLine1: "Address Line 1",
  addressLine2: undefined,
  city: "Some city on United States",
  provinceState: undefined,
  postalCode: undefined,
  country: "United States",
  phone: "####4*****^%$#@$^9",
  email: "jane.doe@somedomain.com",
  offeringIntensity: OfferingIntensity.partTime,
};

export const MSFAA_PART_TIME_RELATIONSHIP_OTHER: MSFAATestInputData = {
  msfaaNumber: "1002",
  sin: "900000002",
  institutionCode: "IHKL",
  birthDate: "2001-12-31",
  surname: "Other Doe",
  givenName: "Other John",
  gender: "woman",
  maritalStatus: RelationshipStatus.Other,
  addressLine1: "Address Line 1",
  addressLine2: "Address Line 2",
  city: "Victoria",
  provinceState: "BC",
  postalCode: "H1H 1H1",
  country: "Canada",
  phone: "99999999999999999999",
  email: "jane.doe@someotherdomain.com",
  offeringIntensity: OfferingIntensity.partTime,
};
