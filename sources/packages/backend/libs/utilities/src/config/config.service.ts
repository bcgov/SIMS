import { Injectable } from "@nestjs/common";
import {
  ATBCIntegrationConfig,
  AuthConfig,
  BCeIDConfig,
  CRAIntegrationConfig,
  ESDCIntegrationConfig,
  FormsConfig,
  GCNotify,
  InstitutionIntegrationConfig,
  SFASIntegrationConfig,
  SFTPConfig,
  DatabaseConfiguration,
  RedisConfiguration,
  CASIntegrationConfig,
  S3Configuration,
  QueueDashboardAccess,
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
  get zoneBSFTP(): SFTPConfig {
    return this.getCachedConfig("zoneBSFTPConfig", {
      host: process.env.ZONE_B_SFTP_SERVER,
      port: parseInt(process.env.ZONE_B_SFTP_SERVER_PORT),
      username: process.env.ZONE_B_SFTP_USER_NAME,
      passphrase: process.env.ZONE_B_SFTP_PRIVATE_KEY_PASSPHRASE,
      privateKey: process.env.ZONE_B_SFTP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
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
      ftpSendFolder: process.env.SFAS_SEND_FOLDER,
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
   * Fulltime allowed Configuration.
   * @returns fulltime allowed true if fulltime is allowed, otherwise false.
   */
  get isFulltimeAllowed(): boolean {
    return this.getCachedConfig(
      "isFulltimeAllowedConfig",
      process.env.IS_FULLTIME_ALLOWED === "true",
    );
  }

  /**
   * App environment.
   * @returns app environment.
   */
  get appEnv(): string {
    return this.getCachedConfig("appEnvConfig", process.env.APP_ENV);
  }

  /**
   * Maximum idle time for warning student Configuration.
   * @returns maximum idle time for warning student number.
   */
  get maximumIdleTimeForWarningStudent(): number {
    return this.getCachedConfig(
      "maximumIdleTimeForWarningStudentConfig",
      +process.env.MAXIMUM_IDLE_TIME_FOR_WARNING_STUDENT,
    );
  }

  /**
   * Maximum idle time for warning supporting user Configuration.
   * @returns maximum idle time for warning supporting user number.
   */
  get maximumIdleTimeForWarningSupportingUser(): number {
    return this.getCachedConfig(
      "maximumIdleTimeForWarningSupportingUserConfig",
      +process.env.MAXIMUM_IDLE_TIME_FOR_WARNING_SUPPORTING_USER,
    );
  }

  /**
   * Maximum idle time for warning institution Configuration.
   * @returns maximum idle time for warning institution number.
   */
  get maximumIdleTimeForWarningInstitution(): number {
    return this.getCachedConfig(
      "maximumIdleTimeForWarningInstitutionConfig",
      +process.env.MAXIMUM_IDLE_TIME_FOR_WARNING_INSTITUTION,
    );
  }

  /**
   * Maximum idle time for warning AEST Configuration.
   * @returns maximum idle time for warning AEST number.
   */
  get maximumIdleTimeForWarningAEST(): number {
    return this.getCachedConfig(
      "maximumIdleTimeForWarningAESTConfig",
      +process.env.MAXIMUM_IDLE_TIME_FOR_WARNING_AEST,
    );
  }

  /**
   * Number of weeks before the study end date that an application can be submitted.
   * If the application is submitted after the deadline, study end date is past exception will be created
   * and it requires to be approved by the ministry.
   * @return number of weeks before the study end date that an application can be submitted.
   */
  get applicationSubmissionDeadlineWeeks(): number {
    return this.getCachedConfig(
      "applicationSubmissionDeadlineWeeksConfig",
      +process.env.APPLICATION_SUBMISSION_DEADLINE_WEEKS,
    );
  }

  /**
   * When defined as true, allows only users registered in beta users table
   * to access full-time features.
   * When defined as false, all users can access full-time features.
   */
  get allowBetaUsersOnly(): boolean {
    return this.getCachedConfig(
      "allowBetaUsersOnlyConfig",
      process.env.ALLOW_BETA_USERS_ONLY === "true",
    );
  }

  /**
   * When enabled, allow full-time application submission
   * only for programs from beta institution locations.
   */
  get allowBetaInstitutionsOnly(): boolean {
    return this.getCachedConfig(
      "allowBetaInstitutionsOnlyConfig",
      process.env.ALLOW_BETA_INSTITUTIONS_ONLY === "true",
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
   * When defined as true, bypasses the MSFAA signing process.
   * The MSFAA process will execute all steps expected trying to
   * find an available MSFAA to be reused.
   * If no MSFAA is available, a new one will be created and signed.
   * Only for non-production environments where MSFAA signing can be bypassed.
   */
  get bypassMSFAASigning(): boolean {
    return this.getCachedConfig(
      "bypassMSFAASigningConfig",
      process.env.BYPASS_MSFAA_SIGNING === "true",
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

  /**
   * Institutions integration configuration.
   */
  get institutionIntegration(): InstitutionIntegrationConfig {
    return this.getCachedConfig("institutionIntegrationConfig", {
      ftpRequestFolder: process.env.INSTITUTION_REQUEST_FOLDER,
      ftpResponseFolder: process.env.INSTITUTION_RESPONSE_FOLDER,
    });
  }

  /**
   * Database configuration.
   */
  get database(): DatabaseConfiguration {
    return this.getCachedConfig("databaseConfiguration", {
      databaseName: process.env.POSTGRES_DB,
      isORMCacheDisabled: process.env.DISABLE_ORM_CACHE === "true",
    });
  }

  /**
   * Redis configuration.
   */
  get redis(): RedisConfiguration {
    return this.getCachedConfig("redisConfiguration", {
      redisHost: process.env.REDIS_HOST || "localhost",
      redisPort: +process.env.REDIS_PORT || 6379,
      redisPassword: process.env.REDIS_PASSWORD,
      redisStandaloneMode: process.env.REDIS_STANDALONE_MODE === "true",
    });
  }

  /**
   * Workers port.
   */
  get workersPort(): number {
    return this.getCachedConfig(
      "workersPortConfig",
      +process.env.WORKERS_PORT || 3020,
    );
  }

  /**
   * Queue dashboard access configurations.
   */
  get queueDashboardAccess(): QueueDashboardAccess {
    return this.getCachedConfig("queueDashboardAccessConfig", {
      tokenSecret: Buffer.from(
        process.env.QUEUE_DASHBOARD_TOKEN_SECRET,
        "base64",
      ),
      tokenExpirationSeconds:
        +process.env.QUEUE_DASHBOARD_TOKEN_EXPIRATION_SECONDS,
      baseURL: process.env.QUEUE_DASHBOARD_BASE_URL,
    });
  }

  /**
   * Queue consumers port.
   */
  get queueConsumersPort(): number {
    return this.getCachedConfig(
      "queueConsumersPortConfig",
      +process.env.QUEUE_CONSUMERS_PORT || 3010,
    );
  }

  /**
   * Queue prefix.
   */
  get queuePrefix(): string {
    return this.getCachedConfig("queuePrefixConfig", process.env.QUEUE_PREFIX);
  }

  /**
   * CAS configuration.
   */
  get casIntegration(): CASIntegrationConfig {
    return this.getCachedConfig("casIntegrationConfig", {
      baseUrl: process.env.CAS_BASE_URL,
      clientCredential: {
        clientId: process.env.CAS_CLIENT_ID,
        clientSecret: process.env.CAS_CLIENT_SECRET,
      },
    });
  }

  /**
   * S3 storage configuration.
   */
  get s3Configuration(): S3Configuration {
    return this.getCachedConfig("s3ConfigurationConfig", {
      endpoint: process.env.S3_ENDPOINT,
      clientCredential: {
        clientId: process.env.S3_ACCESS_KEY_ID,
        clientSecret: process.env.S3_SECRET_ACCESS_KEY,
      },
      region: process.env.S3_REGION,
      defaultBucket: process.env.S3_DEFAULT_BUCKET,
    });
  }

  /**
   * Maintenance mode Configuration.
   * @returns maintenance mode true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceMode(): boolean {
    return this.getCachedConfig(
      "maintenanceModeConfig",
      process.env.MAINTENANCE_MODE === "true",
    );
  }

  /**
   * Maintenance Mode Student Configuration.
   * @returns maintenance mode student true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceModeStudent(): boolean {
    return this.getCachedConfig(
      "maintenanceModeStudentConfig",
      process.env.MAINTENANCE_MODE_STUDENT === "true",
    );
  }

  /**
   * Maintenance Mode Ministry Configuration.
   * @returns maintenance mode ministry true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceModeMinistry(): boolean {
    return this.getCachedConfig(
      "maintenanceModeMinistryConfig",
      process.env.MAINTENANCE_MODE_MINISTRY === "true",
    );
  }

  /**
   * Maintenance Mode Institution Configuration.
   * @returns maintenance mode institution true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceModeInstitution(): boolean {
    return this.getCachedConfig(
      "maintenanceModeInstitutionConfig",
      process.env.MAINTENANCE_MODE_INSTITUTION === "true",
    );
  }

  /**
   * Maintenance Mode Supporting User Configuration.
   * @returns maintenance mode supporting user true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceModeSupportingUser(): boolean {
    return this.getCachedConfig(
      "maintenanceModeSupportingUserConfig",
      process.env.MAINTENANCE_MODE_SUPPORTING_USER === "true",
    );
  }

  /**
   * Maintenance Mode External Configuration.
   * @returns maintenance mode external true if maintenance mode is enabled, otherwise false.
   */
  get maintenanceModeExternal(): boolean {
    return this.getCachedConfig(
      "maintenanceModeExternalConfig",
      process.env.MAINTENANCE_MODE_EXTERNAL === "true",
    );
  }

  /**
   * Avoids reading the env configuration every time and creates
   * a property to store the value and keep reading from it.
   * @param key cache key.
   * @param defaultValue default value to be set when none is available.
   * @returns the cached value.
   */
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

  /**
   * Gets the current API version.
   * @returns current API version.
   */
  get apiVersion(): string {
    return this.getCachedConfig("apiVersionConfig", process.env.VERSION);
  }
}
