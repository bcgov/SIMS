export type ClientType = "student" | "institution" | "aest" | "supportingUsers";

export interface IConfig {
  auth: IAuthConfig;
  bceid: BCeIDConfig;
  workflow: WorkflowConfig;
  forms: FormsConfig;
  formFlowApiUrl: string;
  zoneBSFTP: SFTPConfig;
  CRAIntegration: CRAIntegrationConfig;
  simsApiClientCredential: ClientCredential;
  ATBCIntegration: ATBCIntegrationConfig;
  MSFAAIntegration: MSFAAIntegrationConfig;
  SFASIntegrationConfig: SFASIntegrationConfig;
  /**
   * When defined as true, allows the simulation of a complete cycle of the
   * CRA send/response process that allows the workflow to proceed without
   * the need for the actual CRA verification happens. By default, it should be
   * disabled, and should be enabled only for DEV purposes on local developer
   * machine on an environment where the CRA process is not enabled.
   */
  bypassCRAIncomeVerification: boolean;
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
  clientId: string;
  clientSecret: string;
}

export interface WorkflowConfig {
  ruleEngineUrl: string;

  serviceAccountCredential: UserPasswordCredential;
}

export interface FormsConfig {
  formsUrl: string;
  serviceAccountCredential: UserPasswordCredential;
}

export interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  passphrase: string;
  privateKey: string;
}

export interface CRAIntegrationConfig {
  ftpRequestFolder: string;
  ftpResponseFolder: string;
  programAreaCode: string;
  environmentCode: string;
}

export interface ATBCIntegrationConfig {
  ATBCLoginEndpoint: string;
  ATBCUserName: string;
  ATBCPassword: string;
  ATBCApp: string;
  ATBCEndpoint: string;
}

export interface MSFAAIntegrationConfig {
  ftpRequestFolder: string;
  ftpResponseFolder: string;
  provinceCode: string;
}

export interface SFASIntegrationConfig {
  ftpReceiveFolder: string;
}
