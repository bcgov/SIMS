import { Address } from "@/types";

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
