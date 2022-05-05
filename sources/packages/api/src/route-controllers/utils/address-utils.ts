import { AddressDetailsModel } from "../../services";
import { AddressDetailsAPIOutDTO } from "../models/common.dto";

/**
 * Util to transform address details for formIO.
 * @param addressDetails  is the object that has
 * address details of type AddressDetailsModel.
 * @returns address info as AddressDetailsAPIOutDTO.
 */
export function transformAddressDetailsForAddressBlockForm(
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
