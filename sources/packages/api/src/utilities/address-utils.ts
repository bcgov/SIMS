import { AddressDetailsModel } from "../services";
import { AddressInfo } from "../types";

/**
 * Util to transform address details.
 * @param addressDetails is a partial AddressDetailsModel.
 * @returns address info as AddressInfo.
 */
export function transformAddressDetails(
  addressDetails: Partial<AddressDetailsModel>,
): AddressInfo {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    province: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    canadaPostalCode: addressDetails.canadaPostalCode,
    otherPostalCode: addressDetails.otherPostalCode,
    selectedCountry: addressDetails.selectedCountry,
    otherCountry: addressDetails.otherCountry,
  };
}
