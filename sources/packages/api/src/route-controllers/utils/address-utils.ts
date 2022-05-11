import { AddressInfo } from "../../database/entities";
import { AddressDetailsAPIOutDTO } from "../models/common.dto";
// 'selectedCountry' in the form will have the value 'other',
// when 'Other'(i.e country other than canada) is selected.
const OTHER_COUNTRY = "other";

/**
 * Util to transform address details for formIO.
 * @param addressDetails is the object that has
 * address details of type AddressInfo.
 * @returns address info as need for the formIO.
 */
export function transformAddressDetailsForAddressBlockForm(
  addressDetails: AddressInfo,
): AddressDetailsAPIOutDTO {
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    provinceState: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    canadaPostalCode:
      addressDetails.selectedCountry !== OTHER_COUNTRY
        ? addressDetails.postalCode
        : undefined,
    otherPostalCode:
      addressDetails.selectedCountry === OTHER_COUNTRY
        ? addressDetails.postalCode
        : undefined,
    selectedCountry: addressDetails.selectedCountry,
    otherCountry:
      addressDetails.selectedCountry === OTHER_COUNTRY
        ? addressDetails.country
        : undefined,
  };
}
