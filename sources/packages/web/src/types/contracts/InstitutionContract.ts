export interface Institute {
  name: string;
  code?: string;
}

export interface InstitutionProfileForm {
  userEmail?: string;
  operatingName: string;
  primaryPhone: string;
  primaryEmail: string;
  website: string;
  regulatingBody: string;
  establishedDate: Date;
  // Primary Contact
  primaryContactFirstName: string;
  primaryContactLastName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  // Primary address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  provinceState?: string;
  country: string;
  postalCode: string;
  institutionType: number;
  institutionTypeName?: string;
}

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
  Profit = "Profit",
  NotForProfit = "Not for profit",
}

/**
 * Institution medical school status types.
 */
export enum InstitutionMedicalSchoolStatus {
  Yes = "Yes",
  No = "No",
}
