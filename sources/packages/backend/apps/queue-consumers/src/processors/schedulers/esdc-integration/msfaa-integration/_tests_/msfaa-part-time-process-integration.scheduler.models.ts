import { OfferingIntensity, RelationshipStatus } from "@sims/sims-db";

export interface MSFAATestRecord {
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: string;
  surname: string;
  givenName: string;
  gender: string;
  maritalStatus: RelationshipStatus;
  addressLine1: string;
  addressLine2: RelationshipStatus;
  city: string;
  provinceState: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  offeringIntensity: OfferingIntensity;
}

// TODO: Create input data to generate all MSFAA records.
