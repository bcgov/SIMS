export interface Student {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface CreateStudent extends Student {
  sinNumber?: string;
}

export interface StudentContact {
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface StudentInfo {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    provinceState: string;
    country: string;
    postalCode: string;
    phone: string;
  };
  pdVerified: boolean;
  validSin: boolean;
  sin: string;
  pdSentDate: string;
  pdUpdatedDate: string;
  pdStatus: string;
}

export interface StudentProfile {
  phone: string;
  sinNumber?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}

export interface StudentFormInfo extends StudentInfo {
  birthDateFormatted: string;
  birthDateFormatted2: string;
}

export interface StudentApplication {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}

/**
 * DTO object which is returned by student restriction API.
 */
export interface StudentRestrictionStatus {
  hasRestriction: boolean;
  hasFederalRestriction: boolean;
  hasProvincialRestriction: boolean;
  restrictionMessage: string;
}

/**
 * Enumeration for student permanent disability status.
 */
export enum StudentPDStatus {
  Yes = "Yes",
  No = "No",
  NotRequested = "Not Requested",
  Pending = "Pending",
}
