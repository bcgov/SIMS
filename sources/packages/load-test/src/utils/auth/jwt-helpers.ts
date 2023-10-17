import encoding from "k6/encoding";

/**
 * JWT token separator.
 */
const TOKEN_SEPARATOR = ".";

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
  const [encodedHeader, encodedPayload] = token.split(TOKEN_SEPARATOR);
  let header = decodeTokenPart(encodedHeader);
  let payload = decodeTokenPart(encodedPayload);
  return {
    header,
    payload,
  } as JWTToken;
}

/**
 * Decode token header/payload.
 * @param encodedTokenPart encoded part to be decoded.
 * @returns decoded part.
 */
function decodeTokenPart(encodedTokenPart: string): unknown {
  return JSON.parse(encoding.b64decode(encodedTokenPart, "rawstd", "s"));
}
