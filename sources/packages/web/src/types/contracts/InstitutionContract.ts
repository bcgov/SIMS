import { SystemLookupEntry } from "@/types/contracts/Common";
import { ClientIdType } from "@/types/contracts/ConfigContract";

export interface Institute {
  name: string;
  code?: string;
}

export interface InstitutionMailingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode: string;
  provinceState?: string;
  canadaPostalCode?: string;
  otherPostalCode?: string;
  selectedCountry?: string;
  otherCountry?: string;
}

export interface InstitutionProfileFormData {
  userEmail?: string;
  legalOperatingName: string;
  operatingName: string;
  institutionType: number;
  regulatingBody: string;
  otherRegulatingBody?: string;
  establishedDate: string;
  country?: string;
  province?: string;
  classification?: InstitutionClassification;
  organizationStatus?: InstitutionOrganizationStatus;
  medicalSchoolStatus?: InstitutionMedicalSchoolStatus;
  primaryEmail: string;
  primaryPhone: string;
  website: string;
  // Primary Contact
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  // Mailing Address
  mailingAddress: InstitutionMailingAddress;
  countries: SystemLookupEntry[];
  provinces: SystemLookupEntry[];
  clientType?: ClientIdType;
  mode?: "create" | "edit";
}
export type InstitutionProfileFormInitialData = Omit<
  InstitutionProfileFormData,
  "countries" | "provinces"
>;

/**
 * Institution classification types.
 */
export enum InstitutionClassification {
  Public = "Public",
  Private = "Private",
}

/**
 * Institution organization status types.
 */
export enum InstitutionOrganizationStatus {
  Profit = "profit",
  NotForProfit = "not for profit",
}

/**
 * Institution medical school status types.
 */
export enum InstitutionMedicalSchoolStatus {
  Yes = "yes",
  No = "no",
}
