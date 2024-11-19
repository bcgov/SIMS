import { Reflector } from "@nestjs/core";
/**
 * Specifies when a user account must be already created in order to access a route.
 */
export const RequiresUserAccount = Reflector.createDecorator<boolean>();
