import { ProgramStatus } from "..";

export interface Institute {
  name: string;
  code?: string;
}

export interface AESTInstitutionProgramsSummaryDto {
  programId: number;
  programName: string;
  submittedDate: Date;
  locationName: string;
  programStatus: ProgramStatus;
  totalOfferings: number;
  formattedSubmittedDate: string;
  locationId: number;
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
