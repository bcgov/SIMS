import { AddressInfo } from "@sims/sims-db";
import { AddressDetailsAPIOutDTO } from "../models/common.dto";
import { OTHER_COUNTRY } from "@sims/utilities";

/**
 * Util to transform address details for formIO.
 * @param addressDetails is the object that has
 * address details of type AddressInfo.
 * @returns address info as need for the formIO.
 */
export function transformAddressDetailsForAddressBlockForm(
  addressDetails: AddressInfo,
): AddressDetailsAPIOutDTO {
  const selectedCountry = addressDetails.selectedCountry?.toLowerCase();
  return {
    addressLine1: addressDetails.addressLine1,
    addressLine2: addressDetails.addressLine2,
    provinceState: addressDetails.provinceState,
    country: addressDetails.country,
    city: addressDetails.city,
    postalCode: addressDetails.postalCode,
    canadaPostalCode:
      selectedCountry !== OTHER_COUNTRY ? addressDetails.postalCode : undefined,
    otherPostalCode:
      selectedCountry === OTHER_COUNTRY ? addressDetails.postalCode : undefined,
    selectedCountry: addressDetails.selectedCountry,
    otherCountry:
      selectedCountry === OTHER_COUNTRY ? addressDetails.country : undefined,
  };
}
