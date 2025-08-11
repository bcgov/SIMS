import { BinaryLike, createHash } from "crypto";

/**
 * Hashes an object to a hexadecimal string, using SHA-256.
 * @param data data to be hashed.
 * @returns hexadecimal string representation of the hash (64 length string).
 */
export function hashObjectToHex(data: BinaryLike): string {
  return createHash("sha256").update(data).digest("hex");
}
