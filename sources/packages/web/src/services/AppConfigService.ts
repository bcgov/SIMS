import AuthService from "./AuthService";
import KeyCloak from "keycloak-js";

export interface AppConfig {
  authConfig: {
    url: string;
    realm: string;
    clientId: string;
  };
  updateTime: Date;
}

export class AppConfigService {
  // Share Instance
  private static instance: AppConfigService;

  private _config?: AppConfig;
  public authService?: KeyCloak.KeycloakInstance;

  private readonly _storageKey: string = "app-config";
  private readonly _configExpiry: number = 1000 * 60 * 60;

  public static get shared(): AppConfigService {
    return this.instance || (this.instance = new this());
  }

  private isValidConfig(config: AppConfig) {
    // Validating config from its update time with _config expiry time
    if (Date.now() - config.updateTime.getMilliseconds() > 1000 * 60 * 60) {
      return false;
    }
    return true;
  }

  private getLocalConfig() {
    if (localStorage.getItem(this._storageKey)) {
      const configStr: string = localStorage.getItem(this._storageKey) || "";
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

  async fetchConfig(): Promise<any> {
    // Go to api and fetch config
    // Store in local storage
    // TODO: Remove placeholder
    const config: AppConfig = {
      authConfig: {
        url: "https://dev.oidc.gov.bc.ca/auth/",
        realm: "jxoe2o46",
        clientId: "student"
      },
      updateTime: new Date()
    };
    return config;
  }

  isConfigReady(): boolean {
    return (this._config && this.isValidConfig(this._config)) || false;
  }

  async init() {
    const config = (await this.config()) as AppConfig;
    this.authService = await AuthService(config);
  }
}
