import { AddressDetailsModel } from "../address/address.models";

/**
 * Information that must be provided
 * while creating a new student.
 */
export interface StudentInfo extends AddressDetailsModel {
  phone: string;
  sinNumber: string;
}
