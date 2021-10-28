/**
 * Required personal information to a
 * CRA verification be processed.
 */
export interface MSFAARecord {
  id: number;
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: Date;
  surname: string;
  givenName: string;
  gender: string;
  maritalStatus: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  offeringIntensity: string;
}
