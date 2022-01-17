import { SetMetadata } from "@nestjs/common";

/**
 * This decorator validates if the user's sin is valid before authorizing to access.
 */
export const CHECK_SIN_VALIDATION_KEY = "check-sin-status";
export const CheckSinValidation = () =>
    SetMetadata(CHECK_SIN_VALIDATION_KEY, true);
