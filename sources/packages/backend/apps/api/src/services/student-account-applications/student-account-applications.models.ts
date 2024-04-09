import { StringBuilder } from "@sims/utilities";
import { StudentInfo } from "../student/student.service.models";

/**
 * Data needed to create the user and also
 * the dynamic data that represents the student profile
 * to be assessed by the Ministry.
 * The properties explicity declared represents the
 * information that must be used to create the user that
 * later will be used to be linked to the student.
 */
export interface StudentAccountApplicationCreateModel {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  addressLine1: string;
  addressLine2: string;
  canadaPostalCode: string;
  city: string;
  country: string;
  gender: string;
  identityProvider: string;
  mode: string;
  phone: string;
  postalCode: string;
  provinceState: string;
  selectedCountry: string;
  sinConsent: boolean;
}

/**
 * Data needed to update a user and also a student with the final
 * Ministry review of the student account application.
 */
export type StudentAccountApplicationApprovalModel = StudentInfo &
  StudentAccountApplicationCreateModel & {
    dateOfBirth: string;
    gender: string;
  };

/**
 * Dynamic data submitted by the student for the Ministry review while
 * requesting his identity verification.
 * The properties mapped here represent only the data that must be
 * consumed by the API, for instance, the sinConsent.
 */
export interface AccountApplicationSubmittedData {
  sinConsent: boolean;
}
