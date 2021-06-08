import AuthService from "./AuthService";
import KeyCloak from "keycloak-js";
import ApiClient from "../services/http/ApiClient";
import { AppConfig, ClientIdType } from "../types/contracts/ConfigContract";
import { AppIDPType, ApplicationToken, AppRoutes, AuthStatus } from "../types";
import { RouteHelper } from "../helpers";

export class AppConfigService {
  // Share Instance
  private static instance: AppConfigService;

  private _config?: AppConfig;
  private _authClientType?: ClientIdType;
  public authService?: KeyCloak.KeycloakInstance;

  private readonly _storageKey: string = "app-config";
  private readonly _configExpiry: number = 1000 * 60 * 60;

  public static get shared(): AppConfigService {
    return this.instance || (this.instance = new this());
  }

  public get authClientType(): ClientIdType | undefined {
    return this._authClientType;
  }

  public get userToken(): ApplicationToken | undefined {
    return this.authService?.tokenParsed as ApplicationToken;
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

  async fetchConfig(): Promise<AppConfig> {
    // Go to api and fetch config
    const config = await ApiClient.Configs.getConfig();
    const appConfig: AppConfig = {
      authConfig: config.auth,
      updateTime: new Date(),
    };
    return appConfig;
  }

  isConfigReady(): boolean {
    return (this._config && this.isValidConfig(this._config)) || false;
  }

  async init() {
    await this.config();
  }

  async initAuthService(type: ClientIdType) {
    if (this.authService) {
      return;
    }
    if (this._config) {
      this._authClientType = type;
      this.authService = await AuthService(this._config, type);
    } else {
      throw new Error("Unable to load application: server is not responding");
    }
  }

  async logout(
    type: ClientIdType,
    authService?: KeyCloak.KeycloakInstance,
    isBasicBCeID?: boolean,
    isUserDisabled?: boolean,
  ) {
    const auth: KeyCloak.KeycloakInstance | undefined =
      authService || this.authService;
    if (auth) {
      let redirectUri = `${window.location.protocol}//${window.location.host}/${type}`;
      const externalLogoutUrl = this._config?.authConfig
        .externalSiteMinderLogoutUrl;
      switch (type) {
        case ClientIdType.STUDENT: {
          await auth.logout({
            redirectUri,
          });
          break;
        }
        case ClientIdType.INSTITUTION: {
          if (isBasicBCeID) {
            redirectUri = redirectUri + "/login/business-bceid";
          } else if (isUserDisabled) {
            redirectUri = redirectUri + "/login/disabled-user";
          }
          const logoutURL = auth.createLogoutUrl({
            redirectUri,
          });
          const siteMinderLogoutURL = `${externalLogoutUrl}?returl=${logoutURL}&retnow=1`;
          window.location.href = siteMinderLogoutURL;
          break;
        }
        default:
          await auth.logout();
          break;
      }
    } else {
      throw new Error("No auth unable to logout");
    }
  }

  // TODO: Remove this to RouteHelper
  authStatus(options: { type: ClientIdType; path: string }): AuthStatus {
    if (options.type === this._authClientType) {
      const auth = this.authService?.authenticated || false;
      if (auth) {
        let validUser = false;
        if (this.authService?.tokenParsed) {
          const token = this.authService?.tokenParsed as ApplicationToken;
          switch (options.type) {
            case ClientIdType.INSTITUTION: {
              if (token.IDP === AppIDPType.BCeID) {
                validUser = true;
              }
              break;
            }
            case ClientIdType.STUDENT: {
              if (token.IDP === AppIDPType.BCSC) {
                validUser = true;
              }
              break;
            }
            default:
              validUser = false;
          }
        }
        if (!validUser) {
          return AuthStatus.ForbiddenUser;
        }
        if (RouteHelper.isRootRoute(options.path, options.type)) {
          return AuthStatus.RedirectHome;
        }
        if (options.path.includes(AppRoutes.Login)) {
          return AuthStatus.RedirectHome;
        }
        return AuthStatus.Continue;
      } else {
        //If not authenticated through authservice, ie. auth=false
        if (options.path.includes(AppRoutes.Login)) {
          return AuthStatus.Continue;
        }
        return AuthStatus.RequiredLogin;
      }
    } else {
      //If client type is not as expected from the list
      return AuthStatus.ForbiddenUser;
    }
  }
}
