import { createHash } from "crypto";

/**
 * Hashes an object to a hexadecimal string, using SHA-256.
 * @param obj object to hash.
 * @returns hexadecimal string representation of the hash (64 length string).
 */
export function hashObjectToHex(obj: unknown): string {
  const jsonString = JSON.stringify(obj);
  return createHash("sha256").update(jsonString).digest("hex");
}
