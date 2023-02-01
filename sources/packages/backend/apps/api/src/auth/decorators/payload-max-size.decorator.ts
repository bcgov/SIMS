import { SetMetadata } from "@nestjs/common";

/**
 * This decorator checks if the payload is greater than the maximum size in bytes.
 */
export const PAYLOAD_MAX_SIZE_KEY = "payload-max-size";
export const PayloadMaxSize = (maxSize: number) =>
  SetMetadata(PAYLOAD_MAX_SIZE_KEY, maxSize);
