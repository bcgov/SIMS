import ApiClient from "../services/http/ApiClient";
import { AppConfig } from "../types/contracts/ConfigContract";

export class AppConfigService {
  // Share Instance
  private static instance: AppConfigService;

  private _config?: AppConfig;

  private readonly _storageKey: string = "app-config";
  private readonly _configExpiry: number = 1000 * 60 * 60;

  public static get shared(): AppConfigService {
    return this.instance || (this.instance = new this());
  }

  private isValidConfig(config: AppConfig) {
    // Validating config from its update time with _config expiry time
    if (Date.now() - config.updateTime.getMilliseconds() > this._configExpiry) {
      return false;
    }
    return true;
  }

  private getLocalConfig() {
    if (localStorage.getItem(this._storageKey)) {
      const configStr: string = localStorage.getItem(this._storageKey) ?? "";
      return JSON.parse(configStr);
    }
  }

  private async updateConfig() {
    if (!this.config) {
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
      maximumIdleTimeForWarningStudent: config.maximumIdleTimeForWarningStudent,
      maximumIdleTimeForWarningSupportingUser:
        config.maximumIdleTimeForWarningSupportingUser,
      maximumIdleTimeForWarningInstitution:
        config.maximumIdleTimeForWarningInstitution,
      maximumIdleTimeForWarningAest: config.maximumIdleTimeForWarningAest,
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
