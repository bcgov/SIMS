import dayjs from "dayjs";
import ApiClient from "../services/http/ApiClient";
import { AppConfig } from "../types/contracts/ConfigContract";

export class AppConfigService {
  // Share Instance
  private static instance: AppConfigService;

  private _config?: AppConfig;

  private readonly _storageKey: string = "app-config";
  private readonly _configExpiryMinutes = 60;

  public static get shared(): AppConfigService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Checks if the config is still within its expiry time.
   * @param config config to be validated.
   * @returns true if the config has not expired yet, otherwise false.
   */
  private isValidConfig(config: AppConfig): boolean {
    const expiresAt = dayjs(config.updateTime).add(
      this._configExpiryMinutes,
      "minute",
    );
    return dayjs().isBefore(expiresAt);
  }

  private getLocalConfig() {
    if (localStorage.getItem(this._storageKey)) {
      const configStr: string = localStorage.getItem(this._storageKey) ?? "";
      return JSON.parse(configStr);
    }
  }

  private async updateConfig() {
    if (!this._config) {
      if (localStorage.getItem(this._storageKey)) {
        const config = this.getLocalConfig() as AppConfig;
        if (this.isValidConfig(config)) {
          this._config = config;
        }
      }
    }
    if (!this._config) {
      this._config = await this.fetchConfig();
    }
    return this._config;
  }

  async config() {
    if (this._config && this.isValidConfig(this._config)) {
      return this._config;
    } else {
      delete this._config;
      return await this.updateConfig();
    }
  }

  async fetchConfig(): Promise<AppConfig> {
    // Go to api and fetch config
    const config = await ApiClient.Configs.getConfig();
    const appConfig: AppConfig = {
      authConfig: config.auth,
      updateTime: new Date(),
      version: config.version,
      isFulltimeAllowed: config.isFulltimeAllowed,
      allowBetaInstitutionsOnly: config.allowBetaInstitutionsOnly,
      maximumIdleTimeForWarningStudent: config.maximumIdleTimeForWarningStudent,
      maximumIdleTimeForWarningSupportingUser:
        config.maximumIdleTimeForWarningSupportingUser,
      maximumIdleTimeForWarningInstitution:
        config.maximumIdleTimeForWarningInstitution,
      maximumIdleTimeForWarningAEST: config.maximumIdleTimeForWarningAEST,
      applicationSubmissionDeadlineWeeks:
        config.applicationSubmissionDeadlineWeeks,
      appEnv: config.appEnv,
      queueDashboardURL: config.queueDashboardURL,
      maintenanceMode: config.maintenanceMode,
      maintenanceModeStudent: config.maintenanceModeStudent,
      maintenanceModeInstitution: config.maintenanceModeInstitution,
      maintenanceModeMinistry: config.maintenanceModeMinistry,
      maintenanceModeSupportingUser: config.maintenanceModeSupportingUser,
      maintenanceModeExternal: config.maintenanceModeExternal,
      featureToggles: config.featureToggles ?? [],
    };
    return appConfig;
  }

  isConfigReady(): boolean {
    return (this._config && this.isValidConfig(this._config)) || false;
  }

  async init() {
    await this.config();
  }
}
