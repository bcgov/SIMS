import { Injectable } from "@nestjs/common";
import { AddressInfo, StudentProfileSnapshot } from "@sims/sims-db";

Injectable();
export class CASSupplierSharedService {
  /**
   * Get a snapshot of the student profile.
   * @param firstName student first name.
   * @param lastName student last name.
   * @param sin student sin.
   * @param addressInfo student address.
   * @returns student profile snapshot.
   */
  getStudentProfileSnapshot(
    firstName: string = null,
    lastName: string,
    sin: string,
    addressInfo: AddressInfo,
  ): StudentProfileSnapshot {
    return {
      firstName: firstName,
      lastName: lastName,
      sin: sin,
      addressLine1: addressInfo.addressLine1,
      city: addressInfo.city,
      province: addressInfo.provinceState,
      postalCode: addressInfo.postalCode,
      country: addressInfo.country,
    };
  }
}
