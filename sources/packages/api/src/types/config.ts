export type ClientType = "student" | "institution";

export interface IConfig {
  auth: IAuthConfig;
  bceid: BCeIDConfig;
  workflow: WorkflowConfig;
  forms: FormsConfig;
  formsFlow: FormsFlowConfig;
}

export interface IAuthConfig {
  url: string;
  realm: string;
  clientIds: { [K in ClientType]: string };
  openIdConfigurationUrl: string;
  externalSiteMinderLogoutUrl?: string;
}

/**
 * BCeID configuration required to execute the SOAP requests
 * to the BCeID Web Service.
 */
export interface BCeIDConfig {
  /**
   * WSDL endpoint from BCeID Web Service, for instance,
   * https://gws1.test.bceid.ca/webservices/Client/V10/BCeIDService.asmx?wsdl
   */
  wsdlEndpoint: string;
  /**
   * The Online Service Identifier is a unique key given to each Online Service.
   * When you create an Online Service this identifier is generated.
   * This key will be used in conjunction with the service account to
   * determine authorizations to access each method.
   * Linked to the IDIR by BCeID (IDIM team-CITZ Services), ISA required.
   */
  onlineServiceId: string;
  /**
   * The user GUID of the user that will be executing the Web Services calls.
   * This user represents the user from Ministry LDAP and not the user from
   * Keyclock and/or BCeID. The expectation is to receive this as a
   * configurable parameter.
   */
  requesterUserGuid: string;
  /**
   * User and password used to authenticate to the BCeID Web Service.
   * The user name is expected to be in the format Domain\UserName
   * (e.g. IDIR\UserName).
   */
  credential: UserPasswordCredential;
}

export interface UserPasswordCredential {
  userName: string;
  password: string;
}

export interface ClientCredential {
  ClientId: string;
  ClientSecret: string;
}

export interface WorkflowConfig {
  ruleEngineUrl: string;

  serviceAccountCredential: UserPasswordCredential;
}

export interface FormsConfig {
  formsUrl: string;
  serviceAccountCredential: UserPasswordCredential;
}

export interface FormsFlowConfig {
  formFlowApiUrl: string;
  credential: ClientCredential;
}
