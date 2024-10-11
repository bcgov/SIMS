import { AddressInfo } from "@sims/sims-db";

// 'selectedCountry' in the student contact info will have the value 'other',
// when 'Other'(i.e country other than canada) is selected.
export const OTHER_COUNTRY = "other";
// 'selectedCountry' in the student contact info will have the value 'canada',
// when 'Canada' is selected.
export const COUNTRY_CANADA = "canada";

/**
 * Inspects the address info ro determine if the address is from Canada.
 * @param address address info to be inspected.
 * @returns true if the address is from Canada, otherwise false.
 */
export function isAddressFromCanada(address: AddressInfo) {
  return address.selectedCountry === COUNTRY_CANADA;
}
