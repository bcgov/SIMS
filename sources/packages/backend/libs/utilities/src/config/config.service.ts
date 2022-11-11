import { Injectable } from "@nestjs/common";
import {
  ATBCIntegrationConfig,
  AuthConfig,
  BCeIDConfig,
  ClientCredential,
  CRAIntegrationConfig,
  ESDCIntegrationConfig,
  FormsConfig,
  GCNotify,
  SFASIntegrationConfig,
  SFTPConfig,
} from "./config.models";

@Injectable()
export class ConfigService {
  /**
   * Keycloak authentication configuration.
   */
  get auth(): AuthConfig {
    return this.getCachedConfig("authConfig", {
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
    });
  }

  /**
   * BCeID Web Service configuration.
   */
  get bceid(): BCeIDConfig {
    return this.getCachedConfig("bceidConfig", {
      wsdlEndpoint: process.env.BCeID_WEB_SERVICE_WSDL,
      onlineServiceId: process.env.BCeID_WEB_SERVICE_ONLINE_SERVICE_ID,
      requesterUserGuid: process.env.BCeID_WEB_SERVICE_REQUESTER_USER_GUID,
      credential: {
        userName: process.env.BCeID_WEB_SERVICE_AUTH_USER_NAME,
        password: process.env.BCeID_WEB_SERVICE_AUTH_USER_PASSWORD,
      },
    });
  }

  /**
   * Notification API configuration.
   */
  get notify(): GCNotify {
    return this.getCachedConfig("notifyConfig", {
      url: process.env.GC_NOTIFY_URL,
      apiKey: process.env.GC_NOTIFY_API_KEY,
      toAddress: process.env.GC_NOTIFY_TO_ADDRESS,
    });
  }

  /**
   * Form.io API configuration.
   */
  get forms(): FormsConfig {
    return this.getCachedConfig("formsConfig", {
      formsUrl: process.env.FORMS_URL,
      serviceAccountCredential: {
        userName: process.env.FORMS_SA_USER_NAME,
        password: process.env.FORMS_SA_PASSWORD,
      },
    });
  }

  /**
   * SIMS API API client credential configuration.
   */
  get simsApiClientCredential(): ClientCredential {
    return this.getCachedConfig("simsApiClientCredentialConfig", {
      clientId: process.env.SIMS_API_CLIENT_ID,
      clientSecret: process.env.SIMS_API_CLIENT_SECRET,
    });
  }

  /**
   * SIMS API API client credential configuration.
   */
  get zoneBSFTP(): SFTPConfig {
    return this.getCachedConfig("zoneBSFTPConfig", {
      host: process.env.ZONE_B_SFTP_SERVER,
      port: parseInt(process.env.ZONE_B_SFTP_SERVER_PORT),
      username: process.env.ZONE_B_SFTP_USER_NAME,
      passphrase: process.env.ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE,
      privateKey: process.env.ZONE_B_SFTP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  /**
   * CRA integration configuration.
   */
  get craIntegration(): CRAIntegrationConfig {
    return this.getCachedConfig("craIntegrationConfig", {
      ftpRequestFolder: process.env.CRA_REQUEST_FOLDER,
      ftpResponseFolder: process.env.CRA_RESPONSE_FOLDER,
      programAreaCode: process.env.CRA_PROGRAM_AREA_CODE,
      environmentCode: process.env.CRA_ENVIRONMENT_CODE,
    });
  }

  /**
   * ATBC integration configuration.
   */
  get atbcIntegration(): ATBCIntegrationConfig {
    return this.getCachedConfig("atbcIntegrationConfig", {
      ATBCLoginEndpoint: process.env.ATBC_LOGIN_ENDPOINT,
      ATBCUserName: process.env.ATBC_USERNAME,
      ATBCPassword: process.env.ATBC_PASSWORD,
      ATBCApp: process.env.ATBC_APP,
      ATBCEndpoint: process.env.ATBC_ENDPOINT,
    });
  }

  /**
   * ESDC integration configuration.
   */
  get esdcIntegration(): ESDCIntegrationConfig {
    return this.getCachedConfig("esdcIntegrationConfig", {
      ftpRequestFolder: process.env.ESDC_REQUEST_FOLDER,
      ftpResponseFolder: process.env.ESDC_RESPONSE_FOLDER,
      environmentCode: process.env.ESDC_ENVIRONMENT_CODE,
    });
  }

  /**
   * SFAS integration configuration.
   */
  get sfasIntegration(): SFASIntegrationConfig {
    return this.getCachedConfig("sfasIntegrationConfig", {
      ftpReceiveFolder: process.env.SFAS_RECEIVE_FOLDER,
    });
  }

  /**
   * Bypass application submitValidations configuration.
   */
  get bypassApplicationSubmitValidations(): boolean {
    return this.getCachedConfig(
      "bypassApplicationSubmitValidationsConfig",
      process.env.BYPASS_APPLICATION_SUBMIT_VALIDATIONS === "true",
    );
  }

  /**
   * When defined as true, allows the simulation of a complete cycle of the
   * CRA send/response process that allows the workflow to proceed without
   * the need for the actual CRA verification happens. By default, it should be
   * disabled, and should be enabled only for DEV purposes on local developer
   * machine or on an environment where the CRA process is not enabled.
   */
  get bypassCRAIncomeVerification(): boolean {
    return this.getCachedConfig(
      "bypassCRAIncomeVerificationConfig",
      process.env.BYPASS_CRA_INCOME_VERIFICATION === "true",
    );
  }

  /**
   * Application archive days.
   */
  get applicationArchiveDays(): number {
    return this.getCachedConfig(
      "applicationArchiveDaysConfig",
      +process.env.APPLICATION_ARCHIVE_DAYS,
    );
  }

  private getCachedConfig<T>(key: string, defaultValue: T): T {
    if (this[key] === undefined) {
      this[key] = defaultValue;
    }
    return this[key];
  }

  private getOpenIdConfigurationUrl(): string {
    return new URL(
      `realms/${process.env.KEYCLOAK_REALM}/.well-known/openid-configuration`,
      process.env.KEYCLOAK_AUTH_URL,
    ).href;
  }
}
