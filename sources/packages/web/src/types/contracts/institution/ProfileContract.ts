export interface InstitutionProfileState {
  studentEmail: string;
  operatingName: string;
  primaryPhoneNumber: string;
  primaryEmail: string;
  institutionWebsite: string;
  regulatingBody: string;
  establishedDate: Date;
  primaryContact: ContactInfo;
  legalContact: ContactInfo;
  primaryAddress: Address;
  institutionType: number;
}

export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface Address {
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  provinceState: string;
  coutry: string;
}
