export interface OpenIdConfig {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  token_introspection_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
}
