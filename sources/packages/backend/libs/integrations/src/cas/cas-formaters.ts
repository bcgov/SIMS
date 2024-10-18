import { convertToASCII } from "@sims/utilities";

const CAS_SUPPLIER_NAME_MAX_LENGTH = 80;
const CAS_ADDRESS_MAX_LENGTH = 35;

/**
 * Format the full name in the expected format (last name, given names).
 * Ensure only ASCII characters are present, make all upper case,
 * and enforce the maximum length accepted by CAS.
 * @param firstName first name (given names).
 * @param lastName last name.
 * @returns formatted full name.
 */
export function formatUserName(firstName: string, lastName: string): string {
  const formattedName = `${lastName}, ${firstName}`.substring(
    0,
    CAS_SUPPLIER_NAME_MAX_LENGTH,
  );
  return convertToASCII(formattedName).toUpperCase();
}

/**
 * Ensure only ASCII characters are present, make all upper case,
 * and enforce the maximum length accepted by CAS.
 * @param address address to be formatted.
 * @returns formatted address.
 */
export function formatAddress(address: string): string {
  return convertToASCII(
    address.substring(0, CAS_ADDRESS_MAX_LENGTH),
  ).toUpperCase();
}

/**
 * Remove postal code white spaces and make all upper case.
 * @param postalCode postal code to be formatted.
 * @returns formatted postal code.
 */
export function formatPostalCode(postalCode: string): string {
  return postalCode.replace(/\s/g, "").toUpperCase();
}
