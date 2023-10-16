/**
 * API authentication credentials.
 */
export interface UserPasswordCredential {
  userName: string;
  password: string;
}

/**
 * Cached token information.
 */
export interface TokenCacheResponse {
  accessToken: string;
  expiresIn: number;
}
