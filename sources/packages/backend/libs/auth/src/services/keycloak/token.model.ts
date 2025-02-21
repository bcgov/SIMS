export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

export interface TokenRequest {
  grant_type: "password" | "client_credentials";
  client_id: string;
  username?: string;
  password?: string;
  client_secret?: string;
}
