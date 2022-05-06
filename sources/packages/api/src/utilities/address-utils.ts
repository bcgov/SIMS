import { AddressInfo } from "../database/entities";

/**
 * Util to transform address details.
 * @param addressDetails is the object
 *  that has address details of type
 *  AddressInfo.
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
