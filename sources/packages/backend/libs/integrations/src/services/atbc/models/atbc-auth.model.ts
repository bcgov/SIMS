export interface ATBCAuthTokenResponse {
  accessToken: string;
}

export interface ATBCHeader {
  headers: { Authorization: string };
  httpsAgent?: any;
}
