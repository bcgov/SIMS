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

const MSFAA_STUDENT_MARRIED: Omit<MSFAATestInputData, "offeringIntensity"> = {
  msfaaNumber: "1000",
  sin: "900000000",
  institutionCode: "ABCD",
  birthDate: "1995-06-30",
  surname: "Doe ÀÁÂÃÄÅÇ",
  givenName: "John ÈÉÊËÌÍÎÏ",
  gender: "man",
  maritalStatus: RelationshipStatus.Married,
  addressLine1: "ÑÒÓÔÕÖ Address Line 1",
  addressLine2: "ÙÚÛÜ Address Line 2",
  city: "Calgary",
  provinceState: "AB",
  postalCode: "H1H 1H1",
  country: "Canada",
  phone: "1111111111",
  email: "john.doe@somedomain.com",
};

const MSFAA_STUDENT_OTHER_COUNTRY: Omit<
  MSFAATestInputData,
  "offeringIntensity"
> = {
  msfaaNumber: "1001",
  sin: "900000001",
  institutionCode: "EFDG",
  birthDate: "2000-01-01",
  surname: "Other Doe àáâãäåç",
  givenName: "Jane èéêëìíîï",
  gender: "preferNotToAnswer",
  maritalStatus: RelationshipStatus.Single,
  addressLine1: "ñóòôõö Address Line 1",
  addressLine2: undefined,
  city: "Some city in the United States",
  provinceState: undefined,
  postalCode: undefined,
  country: "United States",
  phone: "####4*****^%$#@$^9",
  email: "jane.doe@somedomain.com",
};

const MSFAA_STUDENT_RELATIONSHIP_OTHER: Omit<
  MSFAATestInputData,
  "offeringIntensity"
> = {
  msfaaNumber: "1002",
  sin: "900000002",
  institutionCode: "IHKL",
  birthDate: "2001-12-31",
  surname: "Other Doe ùúûüýÿ",
  givenName: "Other John ¢£¥©",
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
};

export const MSFAA_PART_TIME_MARRIED: MSFAATestInputData = {
  ...MSFAA_STUDENT_MARRIED,
  offeringIntensity: OfferingIntensity.partTime,
};

export const MSFAA_FULL_TIME_MARRIED: MSFAATestInputData = {
  ...MSFAA_STUDENT_MARRIED,
  offeringIntensity: OfferingIntensity.fullTime,
};

export const MSFAA_PART_TIME_OTHER_COUNTRY: MSFAATestInputData = {
  ...MSFAA_STUDENT_OTHER_COUNTRY,
  offeringIntensity: OfferingIntensity.partTime,
};

export const MSFAA_FULL_TIME_OTHER_COUNTRY: MSFAATestInputData = {
  ...MSFAA_STUDENT_OTHER_COUNTRY,
  offeringIntensity: OfferingIntensity.fullTime,
};

export const MSFAA_PART_TIME_RELATIONSHIP_OTHER: MSFAATestInputData = {
  ...MSFAA_STUDENT_RELATIONSHIP_OTHER,
  offeringIntensity: OfferingIntensity.partTime,
};

export const MSFAA_FULL_TIME_RELATIONSHIP_OTHER: MSFAATestInputData = {
  ...MSFAA_STUDENT_RELATIONSHIP_OTHER,
  offeringIntensity: OfferingIntensity.fullTime,
};
