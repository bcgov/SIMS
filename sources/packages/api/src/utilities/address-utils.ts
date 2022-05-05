import { AddressDetailsModel } from "../services";
import { AddressInfo } from "../types";

/**
 * Util to transform address details.
 * @param addressDetails is the object
 *  that has address details of type
 *  AddressDetailsModel.
 * @returns address info as AddressInfo.
 */
export function transformAddressDetails(
  addressDetails: AddressDetailsModel,
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
