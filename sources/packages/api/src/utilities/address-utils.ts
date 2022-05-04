import { AddressDetailsAPIOutDTO } from "../route-controllers/models/common.dto";
import { AddressDetailsModel } from "../services";
import { AddressInfo } from "../types";

/**
 * Util to transform address details.
 * @param addressDetails is a partial AddressDetailsModel.
 * @returns address info as AddressInfo.
 */
export function transformAddressDetails(
  addressDetails: AddressDetailsModel,
): AddressInfo {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    province: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    selectedCountry: addressDetails.selectedCountry,
  };
}
/**
 * Util to transform address details for formIO.
 * @param addressDetails is a partial AddressDetailsModel.
 * @returns address info as AddressDetailsAPIOutDTO.
 */
export function transformAddressDetailsForForm(
  addressDetails: AddressDetailsModel,
): AddressDetailsAPIOutDTO {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    provinceState: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    canadaPostalCode:
      addressDetails.selectedCountry !== "other"
        ? addressDetails.postalCode
        : undefined,
    otherPostalCode:
      addressDetails.selectedCountry === "other"
        ? addressDetails.postalCode
        : undefined,
    selectedCountry: addressDetails.selectedCountry,
    otherCountry:
      addressDetails.selectedCountry === "other"
        ? addressDetails.country
        : undefined,
  };
}

/**
 * TODO: THIS WILL BE REMOVED WHEN ALL `province` ARE RENAMED TO `provinceState`
 * Util to transform address details for formIO.
 * @param addressDetails is a partial AddressDetailsModel.
 * @returns address info as AddressDetailsAPIOutDTO.
 */
export function transformAddressDetailsForForm2(
  addressDetails: AddressInfo,
): AddressDetailsAPIOutDTO {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    provinceState: addressDetails.province,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    canadaPostalCode:
      addressDetails.selectedCountry !== "other"
        ? addressDetails.postalCode
        : undefined,
    otherPostalCode:
      addressDetails.selectedCountry === "other"
        ? addressDetails.postalCode
        : undefined,
    selectedCountry: addressDetails.selectedCountry,
    otherCountry:
      addressDetails.selectedCountry === "other"
        ? addressDetails.country
        : undefined,
  };
}
