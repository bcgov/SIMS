/**
 * Information that must be provided
 * while creating a new student.
 */
export interface CreateStudentInfo {
  phone: string;
  sinNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceState: string;
  country: string;
  postalCode: string;
}
