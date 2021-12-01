import { Injectable } from "@nestjs/common";
import { IConfig } from "../../types/config";

@Injectable()
export class ConfigService {
  getConfig(): IConfig {
    return {
      bypassCRAIncomeVerification:
        process.env.BYPASS_CRA_INCOME_VERIFICATION === "true",
      auth: {
        url: process.env.KEYCLOAK_AUTH_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientIds: {
          student: process.env.KEYCLOAK_CLIENT_STUDENT,
          institution: process.env.KEYCLOAK_CLIENT_INSTITUTION,
          aest: process.env.KEYCLOAK_CLIENT_AEST,
          supportingUsers: process.env.KEYCLOAK_CLIENT_SUPPORTING_USERS,
        },
        openIdConfigurationUrl: this.getOpenIdConfigurationUrl(),
        externalSiteMinderLogoutUrl: process.env.SITE_MINDER_LOGOUT_URL,
      },
      bceid: {
        wsdlEndpoint: process.env.BCeID_WEB_SERVICE_WSDL,
        onlineServiceId: process.env.BCeID_WEB_SERVICE_ONLINE_SERVICE_ID,
        requesterUserGuid: process.env.BCeID_WEB_SERVICE_REQUESTER_USER_GUID,
        credential: {
          userName: process.env.BCeID_WEB_SERVICE_AUTH_USER_NAME,
          password: process.env.BCeID_WEB_SERVICE_AUTH_USER_PASSWORD,
        },
      },
      workflow: {
        ruleEngineUrl: process.env.RULE_ENGINE_URL,
        serviceAccountCredential: {
          userName: process.env.WORKFLOW_SA_USER_NAME,
          password: process.env.WORKFLOW_SA_PASSWORD,
        },
      },
      forms: {
        formsUrl: process.env.FORMS_URL,
        serviceAccountCredential: {
          userName: process.env.FORMS_SA_USER_NAME,
          password: process.env.FORMS_SA_PASSWORD,
        },
      },
      formFlowApiUrl: process.env.FORMS_FLOW_API_URL,
      simsApiClientCredential: {
        clientId: process.env.SIMS_API_CLIENT_ID,
        clientSecret: process.env.SIMS_API_CLIENT_SECRET,
      },
      zoneBSFTP: {
        host: process.env.ZONE_B_SFTP_SERVER,
        port: parseInt(process.env.ZONE_B_SFTP_SERVER_PORT),
        username: process.env.ZONE_B_SFTP_USER_NAME,
        passphrase: process.env.ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE,
        privateKey: process.env.ZONE_B_SFTP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      CRAIntegration: {
        ftpRequestFolder: process.env.CRA_REQUEST_FOLDER,
        ftpResponseFolder: process.env.CRA_RESPONSE_FOLDER,
        programAreaCode: process.env.CRA_PROGRAM_AREA_CODE,
        environmentCode: process.env.CRA_ENVIRONMENT_CODE,
      },
      ATBCIntegration: {
        ATBCLoginEndpoint: process.env.ATBC_LOGIN_ENDPOINT,
        ATBCUserName: process.env.ATBC_USERNAME,
        ATBCPassword: process.env.ATBC_PASSWORD,
        ATBCApp: process.env.ATBC_APP,
        ATBCEndpoint: process.env.ATBC_ENDPOINT,
      },
      ESDCIntegration: {
        ftpRequestFolder: process.env.ESDC_REQUEST_FOLDER,
        ftpResponseFolder: process.env.ESDC_RESPONSE_FOLDER,
        environmentCode: process.env.ESDC_ENVIRONMENT_CODE,
      },
      SFASIntegrationConfig: {
        ftpReceiveFolder: process.env.SFAS_RECEIVE_FOLDER,
      },
    };
  }

  private getOpenIdConfigurationUrl(): string {
    return new URL(
      `realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      process.env.KEYCLOAK_AUTH_URL,
    ).href;
  }
}
