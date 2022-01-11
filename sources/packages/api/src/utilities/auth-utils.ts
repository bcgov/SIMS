import { INestApplication, ValidationPipe } from "@nestjs/common";

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
  maxSecondsToExpired: number = 0,
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
export function getUserFullName(user: {
  firstName: string;
  lastName: string;
}): string {
  return `${(user.firstName ?? "").trim()} ${(
    user.lastName ?? ""
  ).trim()}`.trim();
}

/**
 * Convert a given username to following pattern.
 * [lastName], [firstName]
 * Null checks are done as name can be Mononymous.
 * @param firstName
 * @param lastName
 * @returns full name.
 */
export const getIDIRUserFullName = (user: {
  firstName: string;
  lastName: string;
}): string => {
  const seperator = user && user.firstName && user.lastName ? "," : "";
  return user
    ? `${(user.lastName || "").trim()}${seperator} ${(
        user.firstName || ""
      ).trim()}`
    : "";
};
