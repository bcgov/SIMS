import ApiClient from "./http/ApiClient";
import {
  BCeIDDetailsAPIOutDTO,
  BCeIDAccountsAPIOutDTO,
  InstitutionUserDetailsAPIOutDTO,
  InstitutionUserPersistAPIInDTO,
} from "@/services/http/dto";

export class UserService {
  // Share Instance
  private static instance: UserService;

  public static get shared(): UserService {
    return this.instance || (this.instance = new this());
  }

  async getBCeIDAccount(): Promise<BCeIDDetailsAPIOutDTO> {
    return ApiClient.User.bceidAccount();
  }

  async getBCeIDAccounts(): Promise<BCeIDAccountsAPIOutDTO | null> {
    return ApiClient.User.bceidAccounts();
  }

  async getInstitutionUser(): Promise<InstitutionUserDetailsAPIOutDTO> {
    return ApiClient.User.getInstitutionUser();
  }

  async updateInstitutionUser(
    data: InstitutionUserPersistAPIInDTO,
  ): Promise<void> {
    return ApiClient.User.updateInstitutionUser(data);
  }

  /**
   * Tries to create/update the AEST user.
   * @returns true if the user was successfully created/updated or
   * false if the user do not have permission to access the system.
   */
  async syncAESTUser(): Promise<boolean> {
    return ApiClient.User.syncAESTUser();
  }

  /**
   * Allows a token creation to provide access to the queues admin
   * for an already authorized users with a role that allow the access.
   */
  async queueAdminTokenExchange(): Promise<void> {
    await ApiClient.User.queueAdminTokenExchange();
  }
}
