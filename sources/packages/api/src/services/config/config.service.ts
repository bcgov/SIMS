import { Injectable } from "@nestjs/common";
import { IConfig } from "src/types/config";

@Injectable()
export class ConfigService {
  getConfig(): IConfig {
    return {
      auth: {
        url: process.env.KEYCLOAK_AUTH_URL,
        realm: process.env.KEYCLOAK_REALM,
        clientIds: {
          student: process.env.KEYCLOAK_CLIENT_STUDENT,
          institution: process.env.KEYCLOAK_CLIENT_INSTITUTION,
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
      formsFlow: {
        formFlowApiUrl: process.env.FORMS_FLOW_API_URL,
        credential: {
          ClientId: process.env.SIMS_API_CLIENT_ID,
          ClientSecret: process.env.SIMS_API_CLIENT_SECRET,
        },
      },
      zoneB_SFTP: {
        host: process.env.ZONE_B_SFTP_SERVER,
        port: parseInt(process.env.ZONE_B_SFTP_SERVER_PORT),
        username: process.env.ZONE_B_SFTP_USER_NAME,
        passphrase: process.env.ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE,
        privateKey: process.env.ZONE_B_SFTP_PRIVATE_KEY,
      },
      CRAIntegration: {
        ftpRequestFolder: process.env.CRA_REQUEST_FOLDER,
        ftpResponseFolder: process.env.CRA_RESPONSE_FOLDER,
        programAreaCode: process.env.CRA_PROGRAM_AREA_CODE,
        environmentCode: process.env.CRA_ENVIRONMENT_CODE,
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
