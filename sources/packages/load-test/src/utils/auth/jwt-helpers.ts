import encoding from "k6/encoding";

/**
 * JWT token.
 */
export interface JWTToken {
  /**
   * Token header.
   **It can be typed as needed.
   */
  header: unknown;
  /**
   * Token payload.
   **It can be typed as needed.
   */
  payload: { exp: number };
}

/**
 * Decode a JWT token.
 * @param token string to be decoded.
 * @returns decoded token header and payload.
 */
export function decodeJWT(token: string): JWTToken {
  const [encodedHeader, encodedPayload] = token.split(".");
  let header = JSON.parse(encoding.b64decode(encodedHeader, "rawstd", "s"));
  let payload = JSON.parse(encoding.b64decode(encodedPayload, "rawstd", "s"));
  return {
    header,
    payload,
  };
}
