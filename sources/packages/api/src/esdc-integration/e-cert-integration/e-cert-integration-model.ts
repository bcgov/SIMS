import { DisbursementValue, RelationshipStatus } from "../../database/entities";

export interface ECertRecord {
  sin: string;
  applicationNumber: string;
  documentNumber: number;
  disbursementDate: Date;
  documentProducedDate: Date;
  negotiatedExpiryDate: Date;
  schoolAmount: number;
  educationalStartDate: Date;
  educationalEndDate: Date;
  federalInstitutionCode: string;
  weeksOfStudy: number;
  fieldOfStudy: number;
  yearOfStudy: number;
  completionYears: string;
  enrollmentConfirmationDate: Date;
  dateOfBirth: Date;
  lastName: string;
  firstName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  email: string;
  gender: string;
  maritalStatus: RelationshipStatus;
  studentNumber: string;
  awards: Award[];
}

export type Award = Pick<
  DisbursementValue,
  "valueType" | "valueCode" | "valueAmount"
>;
