import Keycloak from "keycloak-js";
import store from "@/store";
import { ClientIdType } from "../types/contracts/ConfigContract";
import { AppConfigService } from "./AppConfigService";
import HttpBaseClient from "./http/common/HttpBaseClient";
import { UserService } from "./UserService";
import { ApiProcessError, IdentityProviders, ApplicationToken } from "@/types";
import { RouteHelper } from "@/helpers";
import { LocationAsRelativeRaw } from "vue-router";
import {
  InstitutionRoutesConst,
  StudentRoutesConst,
} from "@/constants/routes/RouteConstants";
import { RENEW_AUTH_TOKEN_TIMER } from "@/constants/system-constants";
import { StudentService } from "@/services/StudentService";
import { useStudentStore, useInstitutionState } from "@/composables";
import { InstitutionUserService } from "@/services/InstitutionUserService";
import { INVALID_BETA_USER, MISSING_STUDENT_ACCOUNT } from "@/constants";
import { StudentAccountApplicationService } from "./StudentAccountApplicationService";

/**
 * Manages the KeyCloak initialization and authentication methods.
 */
export class AuthService {
  /**
   * Keycloak instance available after the method initialize is called.
   */
  keycloak?: Keycloak = undefined;

  private clientType?: ClientIdType = undefined;
  /**
   * Type of Keycloak client used for initialization.
   */
  get authClientType(): ClientIdType | undefined {
    return this.clientType;
  }

  interval = NaN;

  /**
   * Parsed user token.
   */
  get userToken(): ApplicationToken | undefined {
    return this.keycloak?.tokenParsed as ApplicationToken;
  }

  /**
   * Indicates that Keycloak is already initialized.
   */
  get initialized(): boolean {
    return !!this.keycloak;
  }

  private static instance: AuthService;
  /**
   * Singleton access to the authentication service.
   */
  static get shared(): AuthService {
    return this.instance || (this.instance = new this());
  }

  /**
   * When populated, indicates that there is a route that
   * must take priority over all the other ones.
   * After the redirect happens this variable must
   * be set to undefined.
   */
  priorityRedirect?: LocationAsRelativeRaw = undefined;

  /**
   * Initializes the authentication service with the proper client type.
   * @param clientType Keycloak client type to be used.
   */
  async initialize(clientType: ClientIdType): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.clientType = clientType;
    const config = await AppConfigService.shared.config();

    this.keycloak = new Keycloak({
      url: config.authConfig.url,
      realm: config.authConfig.realm,
      clientId: config.authConfig.clientIds[clientType],
    });

    try {
      await this.keycloak.init({
        onLoad: "check-sso",
        responseMode: "query",
        checkLoginIframe: false,
        pkceMethod: "S256",
      });

      if (this.keycloak.authenticated) {
        this.interval = setInterval(
          this.renewTokenIfExpired,
          RENEW_AUTH_TOKEN_TIMER,
        );
        switch (clientType) {
          case ClientIdType.Student: {
            await this.processStudentLogin();
            break;
          }
          case ClientIdType.Institution: {
            await this.processInstitutionLogin();
            break;
          }
          case ClientIdType.AEST: {
            await this.processAESTLogin();
            break;
          }
        }
      } else {
        clearInterval(this.interval);
      }
    } catch (error: unknown) {
      console.error(`Keycloak initialization error - ${clientType}`);
      console.error(error);
    }
  }

  /**
   * Process the login for the student redirecting to the student profile
   * creation case it is the first access.
   */
  private async processStudentLogin(): Promise<void> {
    const studentStore = useStudentStore(store);
    try {
      // This method will result in a success call only when the
      // student account is present. This is the usual flow.
      await StudentService.shared.synchronizeFromUserToken();
      // When the above method returns a success result we can also
      // assume that the student account is present and valid.
      await studentStore.setHasStudentAccount(true);
      await studentStore.updateProfileData();
    } catch (error: unknown) {
      if (error instanceof ApiProcessError) {
        switch (error.errorType) {
          case INVALID_BETA_USER:
            await this.logout(ClientIdType.Student, {
              invalidBetaUser: true,
            });
            return;
          case MISSING_STUDENT_ACCOUNT:
            if (
              this.userToken?.identityProvider === IdentityProviders.BCeIDBoth
            ) {
              const hasPendingAccountApplication =
                await StudentAccountApplicationService.shared.hasPendingAccountApplication();
              if (hasPendingAccountApplication) {
                // The BCeID student account application is in progress.
                // The student must be redirected to the below page and
                // have access only to the below page.
                this.priorityRedirect = {
                  name: StudentRoutesConst.STUDENT_ACCOUNT_APPLICATION_IN_PROGRESS,
                };
                return;
              }
            }
            // If the student is not present, redirect to
            // student profile for account creation.
            this.priorityRedirect = {
              name: StudentRoutesConst.STUDENT_PROFILE_CREATE,
            };
            return;
        }
      }
      throw error;
    }
  }

  /**
   * Process the login for the institution executing the verifications
   * to determine if the user can proceed or must be redirect somewhere.
   */
  private async processInstitutionLogin(): Promise<void> {
    const institutionStore = useInstitutionState(store);
    const userStatus =
      await InstitutionUserService.shared.getInstitutionUserStatus();
    if (userStatus.isActiveUser === true) {
      // This is the usual login process when everything is ready and the user
      // is allowed to access the system. In this case ensure that the user
      // and institution information is in sync with BCeID.
      await InstitutionUserService.shared.syncBCeIDInformation();
      // User is active so just proceed.
      // The BCeID sync must happen prior to this method to ensure that the most
      // updated information will be loaded into the store.
      await institutionStore.initialize();
      return;
    }

    if (userStatus.isActiveUser === false) {
      // User exists and it is not active.
      // Redirect to login page with a proper message.
      await this.logout(ClientIdType.Institution, {
        isUserDisabled: true,
      });
      return;
    }

    if (
      !userStatus.isExistingUser &&
      !userStatus.associatedInstitutionExists &&
      userStatus.hasBusinessBCeIDAccount
    ) {
      // Business BCeID user logging for the first time when the institution is not created yet.
      // Redirect to the institution profile to allow the user to create the institution.
      this.priorityRedirect = {
        name: InstitutionRoutesConst.INSTITUTION_CREATE,
      };
      // Set the institution user details which is required during the institution setup
      // to institution store.
      await institutionStore.setInstitutionSetupUser();
      return;
    }

    if (!userStatus.isExistingUser) {
      // User is a business BCeID, the institution exists but the user was never added, hence he is not allowed to access
      // the application and must request to his administrator to include him using the manage users UI.
      // Or user is a basic BCeID that must be added by the Ministry before have access to the system.
      await this.logout(ClientIdType.Institution, {
        isUnknownUser: true,
      });
    }
  }

  /**
   * Process the login for AEST verifying if the user belongs to the group that
   * allow an IDIR to have access to the application.
   */
  private async processAESTLogin(): Promise<void> {
    const isAuthorized = await UserService.shared.syncAESTUser();
    if (!isAuthorized) {
      await this.logout(ClientIdType.AEST, { notAllowedUser: true });
    }
  }

  async logout(
    type: ClientIdType,
    options?: {
      isUserDisabled?: boolean;
      isUnknownUser?: boolean;
      notAllowedUser?: boolean;
      invalidBetaUser?: boolean;
    },
  ): Promise<void> {
    if (!this.keycloak) {
      throw new Error("Keycloak not initialized.");
    }
    let redirectUri = RouteHelper.getAbsoluteRootRoute(type);
    switch (type) {
      case ClientIdType.Institution: {
        if (options?.isUserDisabled) {
          redirectUri += "/login/disabled-user";
        } else if (options?.isUnknownUser) {
          redirectUri += "/login/unknown-user";
        }
        await this.executeSiteminderLogoff(redirectUri);
        break;
      }
      case ClientIdType.AEST: {
        if (options?.notAllowedUser) {
          redirectUri += "/login/not-allowed-user";
        }
        await this.executeSiteminderLogoff(redirectUri);
        break;
      }
      case ClientIdType.Student: {
        if (options?.invalidBetaUser) {
          redirectUri += "/login/invalid-beta-user";
        }
        // BCeIDBoth user.
        if (this.userToken?.identityProvider === IdentityProviders.BCeIDBoth) {
          await this.executeSiteminderLogoff(redirectUri);
          break;
        }
        // BCSC user.
        await this.keycloak.logout({
          redirectUri,
        });
        break;
      }
      default:
        await this.keycloak.logout({
          redirectUri,
        });
        break;
    }
  }

  /**
   * Siteminder specific logout workaround.
   * This is a known issue with identity providers which retain session.
   * SiteMinder (for example) will hold that session until the user is logged
   * out using the SiteMinder logout endpoint. The result with your current flow
   * is that although the Keycloak session is destroyed, the SM session is
   * retained so when the login endpoint is clicked the user is logged in seamlessly.
   * @see https://stackoverflow.developer.gov.bc.ca/questions/83
   * @param redirectUri application redirect URI.
   */
  private async executeSiteminderLogoff(redirectUri: string) {
    if (!this.keycloak) {
      throw new Error("Keycloak not initialized.");
    }
    const logoutURL = encodeURIComponent(
      this.keycloak.createLogoutUrl({
        redirectUri,
      }),
    );
    const config = await AppConfigService.shared.config();
    const externalLogoutUrl = config.authConfig.externalSiteMinderLogoutUrl;
    const siteMinderLogoutURL = `${externalLogoutUrl}?retnow=1&returl=${logoutURL}`;
    window.location.href = siteMinderLogoutURL;
  }

  async renewTokenIfExpired() {
    await HttpBaseClient.renewTokenIfExpired();
  }
}
