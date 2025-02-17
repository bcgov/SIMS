export interface QueueDashboardToken {
  /**
   * Issuer of the JWT.
   */
  iss: string;
  /**
   * Subject of the JWT (the user).
   */
  sub: string;
  /**
   * Recipient for which the JWT is intended
   */
  aud: string;
  /**
   * Time after which the JWT expires
   */
  exp: number;
  /**
   * Time at which the JWT was issued; can be used to determine age of the JWT.
   */
  iat: number;
}
