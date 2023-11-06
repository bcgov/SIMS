/**
 * API authentication credentials.
 */
export interface UserPasswordCredential {
  userName: string;
  password: string;
}

/**
 * Client secret authentication credential.
 */
export interface ClientSecretCredential {
  clientSecret: string;
}

/**
 * Cached token information.
 */
export interface TokenCacheResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Authorized parties recognized by the API.
 */
export enum AuthorizedParties {
  Institution = "institution",
  Student = "student",
  AEST = "aest",
  SupportingUsers = "supporting-users",
  LoadTestGateway = "load-test-gateway",
}
