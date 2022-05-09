import { AddressInfo } from "../../database/entities";

/**
 * Information that must be provided
 * while creating a new student.
 */
export interface StudentInfo extends AddressInfo {
  phone: string;
  sinNumber: string;
}
