// Used by the method convertStringToPEM to generate the
// PEM string format required by the jwt validation frameworks.
export const PEM_BEGIN_HEADER = "-----BEGIN PUBLIC KEY-----\n";
export const PEM_END_HEADER = "\n-----END PUBLIC KEY-----";

/**
 * Convert a string to a PEM format.
 * PEM (originally “Privacy Enhanced Mail”) is the most common format for X.509 certificates,
 * CSRs, and cryptographic keys. A PEM file is a text file containing one or more items in
 * Base64 ASCII encoding, each with plain-text headers and footers
 * (e.g. -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----).
 * source: https://www.ssl.com/guide/pem-der-crt-and-cer-x-509-encodings-and-conversions
 * @param publicKey Base64 string without PEM header and footer.
 * @returns String in PEM format.
 */
export function convertStringToPEM(publicKey: string): string {
  if (!publicKey) {
    throw new Error("publicKey parameter was not provided.");
  }

  return `${PEM_BEGIN_HEADER}${publicKey}${PEM_END_HEADER}`;
}
