import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import { IUserToken } from "../auth/userToken.interface";
import { MISSING_USER_INFO } from "../constants";
import { ApiProcessError } from "../types";

export function extractRawUserName(userName: string): string {
  const atIndex = userName.indexOf("@");
  if (atIndex > -1) {
    return userName.substring(0, atIndex);
  }

  return userName;
}

/**
 * Define if a token need to be renewed based in the jwt exp property.
 * @param jwtExp exp token property that defines the expiration.
 * @param maxSecondsToExpired Amount of seconds before the token expires that should be considered to renew it.
 * For instance, if a token has 10min expiration and the parameter is defined as 30, the token will
 * be renewed the result will be true if the token was acquired 9min30s ago or if it is already expired.
 * @returns true if the token is expired or about to expire based on the property maxSecondsToExpired.
 */
export function needRenewJwtToken(
  jwtExp: number,
  maxSecondsToExpired = 0,
): boolean {
  const jwtExpMiliseconds = jwtExp * 1000; // Convert to miliseconds.
  const maxSecondsToExpiredMiliseconds = maxSecondsToExpired * 1000; // Convert to miliseconds.
  const expiredDate = new Date(
    jwtExpMiliseconds - maxSecondsToExpiredMiliseconds,
  );
  return new Date() > expiredDate;
}

/**
 * Creates a Date from a jwt token exp attribute.
 * @param time number from jwt token exp attribute.
 * @returns expiration expressed as a Date.
 */
export function tokenTimeToDate(time: number) {
  return new Date(time * 1000);
}

/**
 * Sets global pipes used during application bootstrap and e2e tests.
 * @param app Nest application.
 */
export function setGlobalPipes(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: false,
    }),
  );
}

/**
 * Gets user full name considering that the user
 * name can be a mononymous names.
 * @param user object with firstName and lastName.
 * @returns user full name.
 */
export function getUserFullName(user?: {
  firstName?: string;
  lastName: string;
}): string {
  return user
    ? `${(user.firstName ?? "").trim()} ${(user.lastName ?? "").trim()}`.trim()
    : "";
}

/**
 * Ensures the user token has the required information (e-mail, last name, and birthdate).
 * @param userToken user token to have the required fields validated.
 */
export function assertUserTokenHasRequiredInfo(userToken: IUserToken): void {
  const isMissingRequiredInfo =
    !userToken.email?.trim() ||
    !userToken.lastName?.trim() ||
    !userToken.birthdate?.trim();
  if (isMissingRequiredInfo) {
    throw new BadRequestException(
      new ApiProcessError(
        "Some mandatory profile information (e-mail, last name, or date of birth) was not " +
          "provided by the identity provider. Please ensure your BC Services Card identity " +
          "information, including a verified e-mail address, is complete and try again.",
        MISSING_USER_INFO,
      ),
    );
  }
}
