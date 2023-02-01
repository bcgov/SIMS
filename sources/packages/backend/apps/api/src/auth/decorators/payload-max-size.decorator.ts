import { SetMetadata } from "@nestjs/common";

/**
 * This decorator check if payload is a json and its maximum size in kb.
 */
export const PAYLOAD_MAX_SIZE_KEY = "payload-max-size";
export const PayloadMaxSize = (maxSize: number) =>
  SetMetadata(PAYLOAD_MAX_SIZE_KEY, maxSize);
