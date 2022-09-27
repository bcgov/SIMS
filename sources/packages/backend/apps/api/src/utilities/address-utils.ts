import { AddressInfo } from "../database/entities";

/**
 * Util to transform address details as `AddressInfo` interface.
 * * The input 'addressDetails' may have properties other than `AddressInfo`,
 * * as it is the extended object of `AddressInfo`.
 * * So, this function ensure that the only `AddressInfo` properties
 * * are returned, that need to save in DB.
 * @param addressDetails addressDetails object is
 * an `AddressInfo` extended object.
 * @returns address info as AddressInfo.
 */
export function transformAddressDetails(
  addressDetails: AddressInfo,
): AddressInfo {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    provinceState: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    selectedCountry: addressDetails.selectedCountry,
  };
}
